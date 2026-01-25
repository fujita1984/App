using Microsoft.AspNetCore.Mvc;

namespace HskTypingWeb.Controllers
{
    public class HskTypeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
