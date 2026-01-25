using Microsoft.AspNetCore.Mvc;

namespace HskTypingWeb.Controllers
{
    public class HskQuizController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
