using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace Europeana_D3.Controllers
{
    [AllowAnonymous]
    public class HomeController : Controller
    {
        public ActionResult About()
        {
            return View();
        }

        public ActionResult Connections()
        {
            return View();
        }

    }
}
