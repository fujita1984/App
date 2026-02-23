using Microsoft.AspNetCore.Mvc;

namespace App.Controllers
{
    public class HskQuizController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
