using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using Scamper.Territories;
using System.Diagnostics;

/////////////////////////////////////////////////////////////////////////
////// UTILITY FUNCTIONS ////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

IWebDriver GetWebDriver()
{
    var options = new ChromeOptions();

    var userDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "ScamperChrome");
    options.AddArgument($"--user-data-dir={userDataDir}");
    options.AddArgument("--disable-blink-features=AutomationControlled");
    options.AddArgument("--disable-dev-shm-usage");
    options.AddArgument("--no-sandbox");
    options.AddArgument("--disable-extensions");
    options.AddExcludedArgument("enable-automation");
    options.AddAdditionalOption("useAutomationExtension", false);

    var driver = new ChromeDriver(options);
    ((IJavaScriptExecutor)driver).ExecuteScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
    driver.Manage().Window.Maximize();
    return driver;
}

void ChaseAwayRivals() // kill chrome and other instances of scamper
{
    var processes = new List<Process>();
    processes.AddRange(Process.GetProcessesByName("chrome"));
    processes.AddRange(Process.GetProcessesByName("chromedriver"));

    foreach (var process in processes)
    {
        process.Kill();
        process.WaitForExit();
    }
}

void ForageTerritories()
{
    var driver = GetWebDriver();
    var searchTerms = new List<string> { "ASP.NET", "C#" };

    var territories = new List<Territory> { new Indeed(driver) };
    foreach (var territory in territories) {
        foreach (var searchTerm in searchTerms) {
            territory.Forage(searchTerm, "Remote");
        }
    }
}

/////////////////////////////////////////////////////////////////////////
////// MAIN LOGIC ///////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////

ChaseAwayRivals();
ForageTerritories();

Console.WriteLine("All territories foraged");
Console.ReadLine();