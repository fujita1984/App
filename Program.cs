// ASP.NET Coreアプリケーションで必要な名前空間をインポート
using App.Data;
using Microsoft.EntityFrameworkCore;

// WebApplicationBuilderを作成 - アプリケーションの設定とサービスの登録を行うためのオブジェクト
var builder = WebApplication.CreateBuilder(args);

// ===== サービスコンテナへのサービス登録 =====
// DIコンテナにサービスを追加することで、アプリケーション全体で使用できるようにする

// コントローラーとビューのサポートを追加（MVC パターンのサポート）
// これにより、Controllersフォルダ内のコントローラーとViewsフォルダ内のビューが使用可能になる
builder.Services.AddControllersWithViews();

// データベースコンテキスト（AppDbContext）をDIコンテナに登録
// これにより、コントローラーなどでデータベース操作ができるようになる
builder.Services.AddDbContext<AppDbContext>(options =>
{
    // MySQLデータベースを使用する設定
    options.UseMySql(
        // appsettings.jsonファイルから「DefaultConnection」という名前の接続文字列を取得
        // 接続文字列には、データベースのサーバー名、ユーザー名、パスワードなどが含まれる
        builder.Configuration.GetConnectionString("DefaultConnection"),
        // MySQLサーバーのバージョンを自動検出
        // データベースに接続して、使用しているMySQLのバージョンを確認する
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    );
});

// ===== アプリケーションのビルド =====
// builderから実際のWebApplicationオブジェクトを作成
// ここまでで登録したすべてのサービスと設定が有効になる
var app = builder.Build();

// ===== HTTPリクエスト処理パイプラインの設定 =====
// ミドルウェアを登録する順序が重要 - リクエストは上から順に処理される

// 開発環境以外（本番環境など）での設定
if (!app.Environment.IsDevelopment())
{
    // エラーが発生した場合、/Home/Errorページにリダイレクト
    // これにより、エラーの詳細情報がユーザーに表示されないようにする
    app.UseExceptionHandler("/Home/Error");
    
    // HSTS（HTTP Strict Transport Security）を有効化
    // ブラウザに対して、このサイトは常にHTTPSでアクセスすべきと指示する（デフォルト30日間）
    // セキュリティを強化するための設定
    app.UseHsts();
}

// HTTPリクエストを自動的にHTTPSにリダイレクト
// セキュアな通信を強制するための設定
app.UseHttpsRedirection();

// 静的ファイル（CSS、JavaScript、画像など）を提供できるようにする
// wwwrootフォルダ内のファイルが直接アクセス可能になる
app.UseStaticFiles();

// ルーティング機能を有効化
// URLパターンとコントローラー/アクションのマッピングを可能にする
app.UseRouting();

// 認証・認可機能を有効化
// ユーザーのアクセス権限をチェックするミドルウェア
app.UseAuthorization();

// ===== ルート設定 =====
// デフォルトのMVCルーティングパターンを設定
// 例: /Home/Index/5 → HomeController の Index アクション、id=5
app.MapControllerRoute(
    name: "default", // ルート名（識別用）
    pattern: "{controller=Home}/{action=Index}/{id?}"); // URLパターン
    // {controller=Home}: コントローラー名（デフォルトはHome）
    // {action=Index}: アクション名（デフォルトはIndex）
    // {id?}: オプションのパラメータ（?は省略可能を意味する）

// ===== アプリケーションの起動 =====
// Webサーバーを起動し、HTTPリクエストの受付を開始
// この行でアプリケーションが実行され続ける
app.Run();
