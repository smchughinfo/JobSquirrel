using Newtonsoft.Json.Linq;
using OpenQA.Selenium;
using OpenQA.Selenium.DevTools.V135.CacheStorage;
using Scamper.ExtensionMethods;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper.Territories
{
    internal class Indeed : Territory
    {
        IWebDriver _driver;
        Dictionary<string, string> selectors = Utilities.GetSelectorsForSite("indeed");

        public Indeed(IWebDriver driver)
        {
            _driver = driver;
        }

        internal override void Forage(string searchTerm, string location)
        {
            SearchJobAndLocation(searchTerm, location);

            int safety = 5;
            while (true)
            {
                var allJobsAlreadyScraped = ScrapeJobsOnPage();
                if (allJobsAlreadyScraped)
                {
                    break;
                }
                if (--safety == 0)
                {
                    Console.WriteLine("WARNING - HIT SCRAPE SAFETY LIMIT");
                    break;
                }
                NavigateToNextPage();
            }
        }

        private void SearchJobAndLocation(string searchTerm, string location)
        {
            Console.WriteLine("Foraging Indeed territory...");
            _driver.Navigate().GoToUrl("https://www.indeed.com");

            try
            {
                while (true)
                {
                    _driver.WaitFor(selectors["searchTerm"]);
                    Thread.Sleep(5000);
                    break;
                }
                
            }
            catch (Exception ex) {
                Console.WriteLine($"Waiting on {selectors["searchTerm"]}");
            }
            

            var whatField = _driver.FindElement(By.CssSelector(selectors["searchTerm"]));
            whatField.SendKeys(Keys.Control + "a");
            whatField.SendKeys(searchTerm);

            Thread.Sleep(1000);

            var whereField = _driver.FindElement(By.CssSelector(selectors["searchLocation"]));
            whereField.SendKeys(Keys.Control + "a");
            whereField.SendKeys(location);
            whereField.SendKeys(Keys.Enter);

            Thread.Sleep(5000);
        }

        private bool ScrapeJobsOnPage()
        {
            var jobCards = _driver.FindElements(By.CssSelector(selectors["jobLink"]));
            var alreadyCachedCards = 0;
            Console.WriteLine($"Found {jobCards.Count} job cards");

            for (int i = 0; i < jobCards.Count; i++)
            {
                var jobLinks = _driver.FindElements(By.CssSelector(selectors["jobLink"]));
                if (i >= jobLinks.Count) break;

                var companyName = jobLinks[i].FindElement(By.XPath(selectors["companyNameRelativeTo_jobLink"])).Text;
                var jobTitle = jobLinks[i].Text;

                // skip if we've already cached this one
                if(AlreadyCached(companyName, jobTitle))
                {
                    alreadyCachedCards++;
                    continue;
                }

                ((IJavaScriptExecutor)_driver).ExecuteScript("arguments[0].scrollIntoView(true);", jobLinks[i]);
                Thread.Sleep(Random.Shared.Next(1000, 3000));

                jobLinks[i].Click();
                Thread.Sleep(3000);

                var rightPane = _driver.FindElement(By.CssSelector(selectors["highlightedJob"]));
                var jobHtml = rightPane.GetAttribute("outerHTML");

                Cache(companyName, jobTitle, jobHtml);
            }

            Console.WriteLine($"Foraging on page complete! Total Jobs: {jobCards.Count} | Already Cached Jobs: {alreadyCachedCards}");
            return alreadyCachedCards == jobCards.Count;
        }

        private void NavigateToNextPage()
        {
            Console.WriteLine("Hopping to next the page. But let's stop and wait for a second...");
            Thread.Sleep(5000);

            var nextPageButton = _driver.FindElement(By.CssSelector(selectors["nextPageButton"]));
            nextPageButton.Click();

            Console.WriteLine("Looks like the coast is clear. But let's stop again just to be safe...");
            Thread.Sleep(5000);

            Console.WriteLine("proceeding...");
        }
    }
}
