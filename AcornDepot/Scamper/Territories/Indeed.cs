using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper.Territories
{
    public class Indeed : ITerritory
    {
        IWebDriver _driver;
        public void Forage(IWebDriver driver)
        {
            _driver = driver;
            driver.Navigate().GoToUrl("https://www.indeed.com");
        }
    }
}
