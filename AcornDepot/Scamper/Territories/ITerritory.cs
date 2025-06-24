using OpenQA.Selenium;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Scamper.Territories
{
    internal interface ITerritory
    {
        internal void Forage(IWebDriver driver);
    }
}
