using App.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace App.Controllers
{
    public class HskListController : Controller
    {
        private readonly AppDbContext _context;

        public HskListController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(int? level, string? sortColumn, string? sortDirection)
        {
            var levels = await _context.HskWords
                .Select(w => w.Hsk_Level)
                .Distinct()
                .OrderBy(l => l)
                .ToListAsync();

            ViewBag.Levels = levels;
            ViewBag.SelectedLevel = level;
            ViewBag.SortColumn = sortColumn ?? "Id";
            ViewBag.SortDirection = sortDirection ?? "asc";

            if (level == null)
            {
                return View(new List<App.Models.HskWord>());
            }

            var query = _context.HskWords.Where(w => w.Hsk_Level == level);

            query = (sortColumn, sortDirection) switch
            {
                ("Chinese", "desc") => query.OrderByDescending(w => w.Chinese),
                ("Chinese", _) => query.OrderBy(w => w.Chinese),
                ("Pinyin", "desc") => query.OrderByDescending(w => w.Pinyin),
                ("Pinyin", _) => query.OrderBy(w => w.Pinyin),
                ("Japanese_Meaning", "desc") => query.OrderByDescending(w => w.Japanese_Meaning),
                ("Japanese_Meaning", _) => query.OrderBy(w => w.Japanese_Meaning),
                ("Id", "desc") => query.OrderByDescending(w => w.Id),
                _ => query.OrderBy(w => w.Id)
            };

            var words = await query.ToListAsync();
            return View(words);
        }
    }
}
