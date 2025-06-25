using OpenQA.Selenium;
using OpenQA.Selenium.Support.UI;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper.ExtensionMethods
{
    internal static class IWebDriverExtensions
    {
        internal static IWebElement WaitFor(this IWebDriver driver, string cssSelector)
        {
            Console.WriteLine($"Waiting on {cssSelector}");
            var wait = new WebDriverWait(driver, TimeSpan.FromDays(365)); // Wait forever
            return wait.Until(driver => driver.FindElement(By.CssSelector(cssSelector)));
        }
    }
}
