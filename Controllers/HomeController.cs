using Microsoft.AspNetCore.Mvc;

namespace HskTypingWeb.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
