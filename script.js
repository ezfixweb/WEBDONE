/**
 * ============================================================================
 * EZFIX - Device Repair Service Platform
 * Modular, maintainable JavaScript architecture
 * ============================================================================
 * Architecture: Clean separation of concerns with organized modules
 * - DOM Cache: Frequent DOM queries cached upfront
 * - Storage: Centralized localStorage/sessionStorage management
 * - Data: All service/icon/parts data in one organized place
 * - State: Application state management
 * - Functions: Organized by feature area with clear dependencies
 * - Events: Event listeners attached at end
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {

    // ========================================================================
    // MODULE 1: DOM ELEMENT CACHE
    // Cache all frequently accessed DOM elements for better performance
    // ========================================================================
    const DOM = {
        // Navigation & layout
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        navLinks: document.querySelector('.nav-links'),
        pages: document.querySelectorAll('.page'),
        navPageLinks: document.querySelectorAll('[data-page]'),
        langToggle: document.getElementById('langToggle'),
        cookieConsent: document.getElementById('cookieConsent'),
        cookieAcceptBtn: document.getElementById('cookieAcceptBtn'),
        cookieDeclineBtn: document.getElementById('cookieDeclineBtn'),
        
        // Auth elements
        loginModal: document.getElementById('loginModal'),
        loginForm: document.getElementById('loginForm'),
        logoutBtn: document.getElementById('logoutBtn'),
        loginNavBtn: document.getElementById('loginNavBtn'),
        
        // Cart & checkout
        cartBtn: document.getElementById('cartBtn'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        cartCountEls: document.querySelectorAll('[data-role="cart-count"]'),
        checkoutForm: document.getElementById('checkoutForm'),

        // Order tracking
        trackForm: document.getElementById('trackForm'),
        trackOrderNumber: document.getElementById('trackOrderNumber'),
        trackEmail: document.getElementById('trackEmail'),
        trackResult: document.getElementById('trackResult'),
        
        // Admin elements
        statusFilter: document.getElementById('statusFilter'),
        orderTypeFilter: document.getElementById('orderTypeFilter'),
        ordersList: document.getElementById('ordersList'),
        clearOrdersBtn: document.getElementById('clearOrdersBtn'),
        
        // Custom PC builder
        uploadRef: document.getElementById('uploadRef'),
        addBuildToCartBtn: document.getElementById('addBuildToCartBtn'),
        buildList: document.getElementById('buildList'),
        buildTotal: document.getElementById('buildTotal'),
        previewImage: document.getElementById('previewImage')
    };

    const startupLoader = document.getElementById('appLoader');
    function hideStartupLoader() {
        if (!startupLoader) {
            document.body.classList.remove('app-loading');
            return;
        }
        startupLoader.classList.add('is-hiding');
        window.setTimeout(() => {
            startupLoader.remove();
            document.body.classList.remove('app-loading');
        }, 280);
    }

    const perfLoggingEnabled =
        window.location.search.includes('perf=1') ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

    function logPerfMetric(name, durationMs, details = null) {
        if (!perfLoggingEnabled) return;
        const safeDuration = Number.isFinite(durationMs) ? durationMs : 0;
        if (details) {
            console.info(`[perf] ${name}: ${safeDuration.toFixed(1)}ms`, details);
            return;
        }
        console.info(`[perf] ${name}: ${safeDuration.toFixed(1)}ms`);
    }

    window.addEventListener('load', () => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (!nav) return;
        logPerfMetric('page-dom-content-loaded', nav.domContentLoadedEventEnd);
        logPerfMetric('page-load-complete', nav.loadEventEnd);
    });

    // ========================================================================
    // MODULE 1.5: INTERNATIONALIZATION (CZ/EN)
    // ========================================================================

    const I18N = {
        cs: {
            'Home': 'Domů',
            'Services': 'Služby',
            'Custom Builds': 'Vlastní sestavy',
            '3D Printing': '3D tisk',
            'About': 'O nás',
            'Admin': 'Administrace',
            'Login': 'Prihlasit se',
            'Logout': 'Odhlasit se',
            'Forgot password?': 'Zapomneli jste heslo?',
            'Reset Password': 'Obnova hesla',
            'Send reset link': 'Odeslat odkaz pro obnovu',
            'Back to login': 'Zpet na prihlaseni',
            'Update password': 'Zmenit heslo',
            'Reset link sent': 'Odkaz pro obnovu byl odeslan',
            'Password updated': 'Heslo bylo zmeneno',
            'Admin Support Access': 'Administratorsky pristup',
            'Username or Email': 'Uzivatelske jmeno nebo e-mail',
            'Enter username or email': 'Zadejte uzivatelske jmeno nebo e-mail',
            'Password': 'Heslo',
            'Enter password': 'Zadejte heslo',
            'Send Email to Customer': 'Odeslat e-mail zakaznikovi',
            'Customer Email': 'E-mail zakaznika',
            'Customer Name': 'Jmeno zakaznika',
            'Subject': 'Predmet',
            'Enter email subject': 'Zadejte predmet e-mailu',
            'Message': 'Zprava',
            'Enter email message': 'Zadejte text zpravy',
            'Cancel': 'Zrusit',
            'Send Email': 'Odeslat e-mail',
            'Terms & Conditions': 'Podminky a ustanoveni',
            'Cookie Preferences': 'Nastavení cookies',
            'We use cookies to improve your experience. Do you accept cookies?': 'Používáme cookies pro zlepšení vašeho zážitku. Souhlasíte s cookies?',
            'Accept': 'Přijmout',
            'Decline': 'Odmítnout',
            'By placing an order, you agree to the following terms:': 'Odeslanim objednavky souhlasite s nasledujicimi podminkami:',
            'Diagnostics are free unless otherwise stated.': 'Diagnostika je zdarma, pokud neni uvedeno jinak.',
            'Repair timelines are estimates and may change.': 'Casy oprav jsou orientacni a mohou se zmenit.',
            'Data loss is possible; please back up your device.': 'Muže dojit ke ztrate dat; zalohujte prosim zarizeni.',
            'Quoted prices may change after inspection.': 'Ceny se mohou po kontrole zmenit.',
            'Unclaimed devices may be disposed of after 60 days.': 'Nevyzvednuta zarizeni mohou byt po 60 dnech zlikvidovana.',
            'If you have questions, contact support before submitting your order.': 'Mate-li dotazy, kontaktujte podporu pred odeslanim objednavky.',
            'Order Details': 'Detaily objednavky',
            'Loading...': 'Načítání...',
            'Part Details': 'Detaily dilu',
            'Specifications': 'Specifikace',
            'Scroll thumbnails left': 'Posunout nahledy doleva',
            'Scroll thumbnails right': 'Posunout nahledy doprava',
            'Expert Tech Solutions': 'Profesionální technologická řešení',
            'We Fix Your': 'Opravíme vaše',
            'Tech Devices': 'zařízení',
            'Professional repair services for smartphones, tablets, notebooks, and desktop PCs. Plus, shop quality parts and accessories.': 'Profesionální opravy smartphonů, tabletů, notebooků a stolních PC. Navíc kvalitní díly a příslušenství.',
            'Service': 'Služby',
            'Devices Repaired': 'Opravených zařízení',
            'Satisfaction Rate': 'Spokojenost',
            'Fast Turnaround': 'Rychlé vyřízení',
            'Everything You Need, One Place': 'Vše na jednom místě',
            'Fast repairs, custom builds, and precision 3D prints with transparent pricing.': 'Rychlé opravy, vlastní sestavy a přesný 3D tisk s transparentní cenou.',
            'Same-Day Repairs': 'Opravy v ten samý den',
            'Clear diagnostics and rapid turnaround on phones, tablets, and laptops.': 'Jasná diagnostika a rychlé opravy telefonů, tabletů a notebooků.',
            'Browse Services': 'Prohlédnout služby',
            'Custom Builds': 'Vlastní sestavy',
            'Design a PC or server with expert guidance and curated parts.': 'Navrhněte PC nebo server s odborným vedením a pečlivě vybranými díly.',
            'Start a Build': 'Začít sestavu',
            '3D Printing': '3D tisk',
            'Upload your model, choose materials, and get precise prints fast.': 'Nahrajte model, zvolte materiály a získejte přesný tisk rychle.',
            'Print a Part': 'Vytisknout díl',
            'Welcome Back': 'Vítejte zpět',
            'Login or create an account to manage your orders.': 'Přihlaste se nebo si vytvořte účet pro správu objednávek.',
            'Register': 'Registrace',
            'Username': 'Uživatelské jméno',
            'Email': 'E-mail',
            'Min 8 chars, uppercase, lowercase, number, special character (any symbol).': 'Min. 8 znaků, velké a malé písmeno, číslo, speciální znak (libovolný symbol).',
            'Confirm Password': 'Potvrdit heslo',
            'Create Account': 'Vytvořit účet',
            'or': 'nebo',
            'Continue with Google': 'Pokračovat s Google',
            'Sign up with Google': 'Registrovat přes Google',
            'Choose a printer, filament, color, strength, and upload your model': 'Vyberte tiskárnu, filament, barvu, pevnost a nahrajte model',
            'Select Printer': 'Vyberte tiskárnu',
            'Pick the printer that matches your needs': 'Zvolte tiskárnu podle potřeb',
            'Select Filament': 'Vyberte filament',
            'Choose filament type': 'Zvolte typ filamentu',
            'Select Color': 'Vyberte barvu',
            'Pick a filament color': 'Zvolte barvu filamentu',
            'Color 1': 'Barva 1',
            'Color 2': 'Barva 2',
            'Color 3': 'Barva 3',
            'Color 4': 'Barva 4',
            'Color 5': 'Barva 5',
            'Select Strength': 'Vyberte pevnost',
            'Choose strength level': 'Zvolte úroveň pevnosti',
            'How many parts?': 'Kolik kusů?',
            'Enter the quantity of parts to print': 'Zadejte počet dílů k tisku',
            'Upload Your File': 'Nahrajte soubor',
            'STL/OBJ/3MF accepted': 'Akceptujeme STL/OBJ/3MF',
            'Upload File': 'Nahrát soubor',
            'No file selected': 'Žádný soubor nevybrán',
            'Add 3D Print to Cart': 'Přidat 3D tisk do košíku',
            'Strength': 'Pevnost',
            'Custom Builds': 'Vlastní sestavy',
            'Build your perfect computer step by step': 'Postavte si ideální počítač krok za krokem',
            'Type': 'Typ',
            'Server Type': 'Typ serveru',
            'Brand': 'Značka',
            'Case': 'Skriň',
            'Other': 'Jiné',
            'Other Items': 'Jiné položky',
            'Other Item': 'Jiná položka',
            'Used Shop': 'Bazar',
            'Used Device': 'Bazarové zařízení',
            'Used Device Details': 'Detaily bazarového zařízení',
            'Used Refurbished Notebook & PC Shop': 'Bazar repasovaných notebooků a PC',
            'Verified used notebooks and PCs with clear specs and transparent prices.': 'Ověřené bazarové notebooky a PC s jasnými specifikacemi a transparentní cenou.',
            'No used shop orders yet': 'Žádné objednávky z bazaru',
            'used shop orders': 'objednávky z bazaru',
            'Used shop orders will appear here': 'Objednávky z bazaru se zobrazí zde',
            'Item': 'Položka',
            'No items': 'Žádné položky',
            'No items yet': 'Žádné položky zatím',
            'No image': 'Bez obrázku',
            'Item added to cart': 'Položka přidána do košíku',
            'Failed to add item to cart': 'Nepodařilo se přidat položku do košíku',
            'No other item orders yet': 'Žádné objednávky ostatních položek',
            'other item orders': 'objednavky ostatnich polozek',
            'Item Details': 'Detaily položky',
            'Other item orders will appear here': 'Objednavky ostatnich polozek se zobrazi zde',
            'Browse 3D printing accessories and tools': 'Prohlédněte příslušenství a nástroje pro 3D tisk',
            'Add to cart': 'Přidat do košíku',
            'added to cart': 'pridano do kosiku',
            'Contact': 'Kontakt',
            'No pickup point selected': 'Nebyl vybrán žádný výdejní bod',
            'Pickup point required': 'Vyberte výdejní bod',
            'Packeta API key is missing': 'Chybí Packeta API klíč',
            'Packeta widget failed to load': 'Packeta widget se nepodařilo načíst',
            'Pickup point': 'Výdejní bod',
            'Zasilkovna': 'Zasilkovna',
            'Česká pošta': 'Česká pošta',
            'PPL': 'PPL',
            'DPD': 'DPD',
            'GLS': 'GLS',
            'Drop-off at Store': 'Osobni predani',
            'Zasilkovna Tracking Number': 'Cislo sledovani Zasilkovny',
            'Track on Zasilkovna': 'Sledovat na Zasilkovne',
            'Select Build Type': 'Vyberte typ sestavy',
            'Choose Custom PC or Server': 'Vyberte vlastni PC nebo server',
            'Back': 'Zpet',
            'Select Server Type': 'Vyberte typ serveru',
            'Choose Server or Home Assistant Server': 'Vyberte server nebo Home Assistant',
            'Select Brand': 'Vyberte značku',
            'Choose Raspberry Pi or Nvidia Jetson': 'Vyberte Raspberry Pi nebo Nvidia Jetson',
            'Select Type': 'Vyberte typ',
            'Choose Small Rack or Case': 'Vyberte maly rack nebo skrine',
            'Select Model': 'Vyberte model',
            'Choose your device model': 'Zvolte model zarizeni',
            'Select RAM': 'Vyberte RAM',
            'Choose memory size': 'Zvolte velikost pameti',
            'Select Storage Type': 'Vyberte typ uloziste',
            'Choose SD card or SSD': 'Zvolte SD kartu nebo SSD',
            'Select Storage Size': 'Vyberte velikost uloziste',
            'Choose capacity': 'Zvolte kapacitu',
            'Select Case or Rack': 'Vyberte skrinku nebo rack',
            'Choose the enclosure': 'Zvolte skrin',
            'Select Switch': 'Vyberte switch',
            'Choose network switch option': 'Zvolte variantu sitoveho switche',
            'Other Details': 'Dalsi detaily',
            'Install options and cluster size': 'Moznosti instalace a velikost clusteru',
            'Install OS': 'Instalovat OS',
            'Cluster': 'Cluster',
            'Select Rack': 'Vyberte rack',
            'Choose your rack size': 'Zvolte velikost racku',
            'Select build status and installation needs': 'Zvolte stav sestavy a instalaci',
            'Build Status': 'Stav sestavy',
            'Installation': 'Instalace',
            'Choose Your Brand': 'Vyberte znacku',
            'Select Intel or AMD for your build': 'Vyberte Intel nebo AMD',
            'Select Your': 'Vyberte',
            'Choose your processor': 'Zvolte procesor',
            'Choose compatible motherboard': 'Zvolte kompatibilni desku',
            'Choose your memory': 'Zvolte pamet',
            'Select Storage': 'Vyberte uloziste',
            'Choose your SSD': 'Zvolte SSD',
            'Select Power Supply': 'Vyberte zdroj',
            'Choose your PSU': 'Zvolte napajeci zdroj',
            'Select Cooler': 'Vyberte chladic',
            'Choose your CPU cooler': 'Zvolte chladic CPU',
            'Select OS': 'Vyberte OS',
            'Choose operating system preference': 'Zvolte preferenci operačního systému',
            'Choose whether you want the system delivered with an operating system.': 'Vyberte, zda chcete sestavu dodat s nainstalovaným operačním systémem.',
            'Your Custom Build': 'Vase sestava',
            'Total:': 'Celkem:',
            'Upload Reference': 'Nahrat reference',
            'Add to Cart': 'Pridat do kosiku',
            'Upload a reference image': 'Nahrajte referencni obrazek',
            'Your Build': 'Vase sestava',
            'No components selected': 'Zadne komponenty nevybrany',
            'Device': 'Zarizeni',
            'Model': 'Model',
            'Repair': 'Oprava',
            'What device needs repair?': 'Jaky pristroj potrebuje opravu?',
            'Select your device type to get started': 'Zvolte typ zarizeni pro zacatek',
            'Phone Repair': 'Oprava telefonu',
            'All brands & models': 'Vsechny znacky a modely',
            'Tablet Repair': 'Oprava tabletu',
            'Notebook Repair': 'Oprava notebooku',
            'PC Repair': 'Oprava PC',
            'Desktop PC Repair': 'Oprava stolniho PC',
            '3D Printer Repair': 'Oprava 3D tiskarny',
            'Select your': 'Vyberte',
            'brand': 'znacku',
            'Choose the manufacturer': 'Zvolte vyrobce',
            'Choose your specific model': 'Zvolte konkretni model',
            'What needs to be repaired?': 'Co je potreba opravit?',
            'About EzFix': 'O EzFix',
            'Your trusted partner for device repairs': 'Vas spolehlivy partner pro opravy zarizeni',
            'Who We Are': 'Kdo jsme',
            'With years of experience in electronics repair, EzFix has become the trusted choice for device repairs in our community. Our certified technicians use only quality parts and provide warranties on all repairs.': 'Diky dlouholetym zkusenostem s opravami elektroniky je EzFix spolehlivou volbou. Nasi certifikovani technici pouzivaji pouze kvalitni dily a poskytuji zaruky na opravy.',
            'We believe in transparent pricing, honest assessments, and getting your device back to you as quickly as possible without compromising on quality.': 'Verime v transparentni ceny, uprimna posouzeni a co nejrychlejsi opravu bez kompromisu v kvalite.',
            'Certified technicians': 'Certifikovani technici',
            '90-day warranty on all repairs': '90denni zaruka na vsechny opravy',
            'Same-day service available': 'Moznost opravy v ten samy den',
            'Free diagnostics': 'Diagnostika zdarma',
            'Quality replacement parts': 'Kvalitni nahradni dily',
            'Customer Satisfaction': 'Spokojenost zakazniku',
            'Average Turnaround': 'Prumerna doba',
            'Years Experience': 'let zkusenosti',
            'Find Us': 'Najdete nas',
            'Address': 'Adresa',
            'Hours': 'Otevírací doba',
            'Phone': 'Telefon',
            'Cart': 'Košík',
            'Mon - Fri: 9AM - 7PM': 'Po - Pa: 9:00 - 19:00',
            'Sat: 10AM - 5PM': 'So: 10:00 - 17:00',
            'Sun: Closed': 'Ne: Zavřeno',
            'Your Cart': 'Váš košík',
            'Review your repair services': 'Zkontrolujte opravárenské služby',
            'Your cart is empty': 'Váš košík je prázdný',
            'Add repair services to get started': 'Přidejte služby opravy a začněte',
            'Order Summary': 'Souhrn objednávky',
            'Subtotal': 'Mezisoučet',
            'Diagnostic Fee': 'Diagnostický poplatek',
            'FREE': 'ZDARMA',
            'Total': 'Celkem',
            '* Final price may vary based on diagnosis': '* Konečná cena se může lišit podle diagnostiky',
            'Proceed to Checkout': 'Pokračovat k pokladně',
            'Add More Services': 'Přidat další služby',
            'Checkout': 'Pokladna',
            'Complete your repair order': 'Dokoncete objednavku opravy',
            'Email Address': 'E-mailova adresa',
            'Delivery Option': 'Zpusob doruceni',
            'Drop-off at Store': 'Osobni predani v prodejne',
            'Bring your device to our location': 'Prineste zarizeni na nasi adresu',
            'Pickup Service': 'Vyzvednuti',
            "We'll pick up your device (+ 15 Kč)": 'Zarizeni vyzvedneme (+ 15 Kč)',
            'Personal Information': 'Osobni udaje',
            'First Name': 'Jmeno',
            'Last Name': 'Prijmeni',
            'Phone Number': 'Telefon',
            'Phone number': 'Telefonni cislo',
            'Delivery Address': 'Dodaci adresa',
            'Street Address': 'Ulice a cislo',
            'Street and number': 'Ulice a cislo popisne',
            'City': 'Mesto',
            'ZIP Code': 'PSC',
            'ZIP code': 'PSC',
            'Country': 'Zeme',
            'Notes (Optional)': 'Poznamka (volitelne)',
            'Special instructions or notes...': 'Specialni pokyny nebo poznamky...',
            'I agree with the': 'Souhlasím s',
            'I agree with the ': 'Souhlasím s ',
            'terms and conditions': 'podminkami a ustanovenimi',
            'Place Order': 'Odeslat objednavku',
            'Your Order': 'Vase objednavka',
            'Pickup Fee': 'Poplatek za vyzvednuti',
            'Zasilkovna Fee': 'Zasilkovna',
            'Track Your Order': 'Sledovat objednavku',
            'Check the latest status on your repair': 'Zkontrolujte aktualni stav opravy',
            'Find your order': 'Najdete objednavku',
            'Enter your order number and email address.': 'Zadejte cislo objednavky a e-mail.',
            'Order Number': 'Cislo objednavky',
            'No tracking details yet': 'Zadne informace o sledovani',
            'Submit your order number to see status updates and items.': 'Zadejte cislo objednavky pro zobrazeni stavu a polozek.',
            'Order Management': 'Sprava objednavek',
            'View and manage all repair orders': 'Zobrazit a spravovat vsechny objednavky',
            'Repairs': 'Opravy',
            'Manage Catalog': 'Spravovat katalog',
            'Admin Credentials': 'Administrátorské údaje',
            'Total Orders': 'Celkem objednavek',
            'Pending': 'Ceka',
            'In Progress': 'V prubehu',
            'Completed': 'Dokonceno',
            'All Status': 'Vsechny stavy',
            'All Types': 'Vsechny typy',
            'Waiting': 'Ceka',
            'Delivering': 'Doručuje se',
            'Delivered': 'Doručeno',
            'Cancelled': 'Zruseno',
            'Clear All Orders': 'Smazat všechny objednávky',
            'All Devices': 'Všechna zařízení',
            'Phones': 'Telefony',
            'Tablets': 'Tablety',
            'Notebooks': 'Notebooky',
            'Desktops': 'Stolni PC',
            'No orders yet': 'Žádné objednávky',
            'Orders will appear here when customers place them': 'Objednávky se zobrazí po zadání',
            'No custom PC orders yet': 'Žádné objednávky vlastních sestav',
            'Custom PC build orders will appear here': 'Objednávky se zobrazí zde',
            'No 3D printing orders yet': 'Žádné objednávky 3D tisku',
            '3D printing requests will appear here': 'Požadavky na 3D tisk se zobrazí zde',
            'Announcement Banner': 'Oznamovací banner',
            'Show a global message across every page.': 'Zobrazit zprávu na všech stránkách.',
            'Active': 'Aktivní',
            'Show banner': 'Zobrazit banner',
            'Enter announcement text...': 'Zadejte text oznameni...',
            'Save Catalog': 'Uložit katalog',
            'Repairs Catalog': 'Katalog oprav',
            'Edit brands, models, and repair prices. Toggle Active to hide items.': 'Upravte značky, modely a ceny oprav. Přepínačem Aktivní skryjete položky.',
            'Device': 'Zařízení',
            'Brands': 'Značky',
            'Add Brand': 'Přidat značku',
            'Models': 'Modely',
            'Add Model': 'Přidat model',
            'Repairs': 'Opravy',
            'Add Repair': 'Přidat opravu',
            'Category': 'Kategorie',
            'Add Part': 'Přidat díl',
            'Manage printers, filament types, and colors.': 'Spravujte tiskárny, filamenty a barvy.',
            'Printers': 'Tiskárny',
            'Add Printer': 'Přidat tiskárnu',
            'Filaments': 'Filamenty',
            'Add Filament': 'Přidat filament',
            'Colors': 'Barvy',
            'Add Color': 'Přidat barvu',
            'Advanced JSON': 'Pokročilé JSON',
            'Optional: edit raw JSON directly.': 'Volitelně: upravte JSON přímo.',
            'Load Current Data': 'Načíst aktuální data',
            'Upload Image': 'Nahrát obrázek',
            'No upload': 'Žádný upload',
            'Show': 'Zobrazit',
            'Hide': 'Skrýt',
            'Current Admin Users': 'Aktuální admini',
            'Add New Admin User': 'Přidat nového admina',
            'Existing username or new username': 'Existující uživatelské jméno nebo nové',
            'Existing user email or new email': 'Existující e-mail nebo nový',
            'Required only for new admin': 'Povinné jen pro nového admina',
            'Required only for new user': 'Povinné jen pro nového uživatele',
            'Add User': 'Přidat uživatele',
            'Edit Admin User': 'Upravit admina',
            'Click Edit on a user': 'Klikněte na Upravit u uživatele',
            'New Password': 'Nové heslo',
            'Leave blank to keep current': 'Nechte prázdné pro zachování',
            'Save Changes': 'Uložit změny',
            'Reset to Default': 'Obnovit výchozí',
            'Reset all credentials to the default (admin / admin123)': 'Obnovit výchozí údaje (admin / admin123)',
            'Reset Credentials': 'Obnovit údaje',
            'Your trusted partner for all device repairs.': 'Váš spolehlivý partner pro všechny opravy zařízení.',
            'Quick Links': 'Rychlé odkazy',
            'Track Order': 'Sledovat objednávku',
            'Services': 'Služby',
            'Contact Us': 'Kontaktujte nás',
            'All rights reserved.': 'Všechna práva vyhrazena.',
            'Active Visitors': 'Aktivní návštěvníci',
            'Search parts, brands, or options': 'Hledejte dily, znacky nebo volby',
            'Clear': 'Vymazat',
            'News and Updates': 'Novinky a aktuality',
            'Latest updates, tips, and offers from EzFix.': 'Nejnovější aktuality, tipy a nabídky od EzFix.',
            'Detail': 'Detail',
            'Add News': 'Přidat novinku',
            'Articles': 'Články',
            'Add and edit homepage news cards with rich formatting.': 'Přidávejte a upravujte novinky na homepage včetně formátování textu.',
            'AI Bot Answers': 'AI odpovědi bota',
            'Customize automatic AI replies for common chat topics.': 'Nastavte automatické AI odpovědi pro běžná témata v chatu.',
            'Save AI Answers': 'Uložit AI odpovědi',
            'Reload': 'Načíst znovu',
            'No chats for selected filters.': 'Žádné chaty pro zvolené filtry.',
            'AI bot answers saved': 'AI odpovědi bota byly uloženy',
            'Failed to load AI answers': 'Nepodařilo se načíst AI odpovědi',
            'Failed to save AI answers': 'Nepodařilo se uložit AI odpovědi',
            'Order Shipped': 'Objednávka odeslána',
            'Screen Fixed': 'Displej opraven',
            'Battery Kit': 'Bateriová sada',
            // Toasts / dialogs
            'Session expired. Please login again.': 'Relace vyprsela. Prihlaste se znovu.',
            'Cannot reach API — is the backend server running?': 'Nelze se spojit s API — bezi backend server?',
            'Select printer, filament, color, strength, and upload a file': 'Vyberte tiskarnu, filament, barvu, pevnost a nahrajte soubor',
            '3D printing added to cart': '3D tisk pridan do kosiku',
            'Failed to add 3D printing to cart': 'Nepodarilo se pridat 3D tisk do kosiku',
            'Login successful': 'Prihlaseni bylo uspesne',
            'Login failed': 'Prihlaseni selhalo',
            'Registration failed': 'Registrace selhala',
            'Passwords do not match': 'Hesla se neshoduji',
            'Account created': 'Ucet vytvoren',
            'Google login failed. Please try again.': 'Prihlaseni pres Google selhalo. Zkuste to znovu.',
            'Failed to add to cart': 'Nepodarilo se pridat do kosiku',
            'Failed to load cart': 'Nepodarilo se nacist kosik',
            'Item removed from cart': 'Polozka odebrana z kosiku',
            'Failed to remove item from cart': 'Nepodarilo se odebrat polozku z kosiku',
            'Failed to load checkout': 'Nepodarilo se nacist pokladnu',
            'Failed to load orders: ': 'Nepodarilo se nacist objednavky: ',
            'Failed to print order details': 'Nepodarilo se vytisknout detaily objednavky',
            'Logged out successfully': 'Uspesne odhlaseni',
            'Order status updated and email sent': 'Stav objednavky aktualizovan a e-mail odeslan',
            'Failed to update order: ': 'Nepodarilo se aktualizovat objednavku: ',
            'Are you sure you want to delete this order?': 'Opravdu chcete smazat tuto objednavku?',
            'Are you sure you want to delete the user': 'Opravdu chcete smazat uzivatele',
            'Order deleted': 'Objednavka smazana',
            'Failed to delete order: ': 'Nepodarilo se smazat objednavku: ',
            'Please select build type first': 'Nejprve zvolte typ sestavy',
            'Please select a server type': 'Zvolte typ serveru',
            'Please complete the Home Assistant build selections': 'Dokoncete volby pro Home Assistant',
            'Please select build type and brand first': 'Nejprve zvolte typ sestavy a znacku',
            'Please select build status, OS, and installation': 'Zvolte stav sestavy, OS a instalaci',
            'Please select OS option': 'Zvolte možnost OS',
            'Please complete the build before adding to cart': 'Dokoncete sestavu pred pridanim do kosiku',
            'Custom build added to cart': 'Vlastni sestava pridana do kosiku',
            'Failed to add build to cart': 'Nepodarilo se pridat sestavu do kosiku',
            'Please login to save builds': 'Prihlaste se pro ulozeni sestav',
            'Build saved — ID: ': 'Sestava ulozena — ID: ',
            'Failed to save build: ': 'Nepodarilo se ulozit sestavu: ',
            'Please fix the errors above': 'Opravte prosim chyby vyse',
            'Failed to create order: ': 'Nepodarilo se vytvorit objednavku: ',
            'Catalog loaded into editor': 'Katalog nacten do editoru',
            'Catalog saved': 'Katalog ulozen',
            'Invalid data or failed to save catalog': 'Neplatna data nebo se nepodarilo ulozit katalog',
            'Image uploaded': 'Obrazek nahran',
            'Uploading...': 'Nahravani...',
            'Upload failed': 'Nahravani selhalo',
            'Are you sure you want to clear ALL orders? This action cannot be undone.': 'Opravdu chcete smazat VSECHNY objednavky? Tuto akci nelze vratit.',
            'All orders have been cleared': 'Vsechny objednavky byly smazany',
            'Failed to clear orders: ': 'Nepodarilo se smazat objednavky: ',
            'This will reset your admin credentials. Are you sure?': 'Obnovi to admin udaje. Opravdu chcete pokracovat?',
            'Role': 'Role',
            'Worker': 'Pracovnik',
            'Manager': 'Manazer',
            'Owner': 'Vlastnik',
            'customer': 'zakaznik',
            'worker': 'pracovnik',
            'manager': 'manazer',
            'owner': 'vlastnik',
            'Failed to load users: ': 'Nepodarilo se nacist uzivatele: ',
            'Permission denied': 'Pristup odepren',
            'Download file': 'Stahnout soubor',
            'Enter a username or email': 'Zadejte uzivatelske jmeno nebo e-mail',
            'Select a user to edit': 'Vyberte uzivatele k uprave',
            'Username is required': 'Uzivatelske jmeno je povinne',
            'Note: This feature requires server configuration. Contact an administrator.': 'Poznamka: Tato funkce vyzaduje konfiguraci serveru. Kontaktujte spravce.',
            'Show password': 'Zobrazit heslo',
            'Hide password': 'Skryt heslo',
            'Switch language': 'Prepnout jazyk',
            'EzFix - Phone, Tablet, Notebook & PC Repair': 'EzFix - Opravy telefonu, tabletu, notebooku a PC',
            'Logging in...': 'Prihlasuji...',
            'Invalid username or password': 'Neplatne uzivatelske jmeno nebo heslo',
            'Processing...': 'Zpracovavam...',
            'Sending...': 'Odesilam...',
            'Email sent successfully to ': 'E-mail odeslan na ',
            'Failed to send email: ': 'Nepodarilo se odeslat e-mail: ',
            'Error: ': 'Chyba: ',
            'Order Update - EzFix': 'Aktualizace objednavky - EzFix',
            'Hi': 'Dobry den',
            'We wanted to follow up on your order.': 'Chceme se ozvat ohledne vasi objednavky.',
            'Best regards,': 'S pozdravem,',
            'EzFix Team': 'Tym EzFix',
            'added to cart': 'pridano do kosiku',
            'Build Type': 'Typ sestavy',
            'Printer': 'Tiskarna',
            'Filament': 'Filament',
            'Color': 'Barva',
            'Parts': 'Kusy',
            'File': 'Soubor',
            'N/A': 'N/A',
            'Custom PC Build': 'Vlastni sestava PC',
            'Custom PC': 'Vlastni PC',
            'Cart is empty': 'Kosik je prazdny',
            'Full Name is required': 'Cele jmeno je povinne',
            'Email is required': 'E-mail je povinny',
            'Phone is required': 'Telefon je povinny',
            'Missing details': 'Chybi udaje',
            'Please enter both your order number and email address.': 'Zadejte cislo objednavky i e-mail.',
            'Placed': 'Zadano',
            'Updated': 'Aktualizovano',
            'Order not found': 'Objednavka nebyla nalezena',
            'Unable to find that order.': 'Objednavku se nepodarilo najit.',
            'No items found for this order.': 'Pro tuto objednavku nebyly nalezeny polozky.',
            'Order': 'Objednavka',
            'Date': 'Datum',
            'Country': 'Zeme',
            'Full Address': 'Cela adresa',
            'Items': 'Polozky',
            'Notes': 'Poznamky',
            'Edit Status': 'Upravit stav',
            'Print': 'Tisk',
            'Delete': 'Smazat',
            'Details': 'Detaily',
            'Order Info': 'Informace o objednavce',
            'Service Type': 'Typ sluzby',
            'Status': 'Stav',
            'Customer': 'Zakaznik',
            'No orders': 'Zadne objednavky',
            'No': 'Zadne',
            'orders': 'objednavky',
            'Thank You!': 'Děkujeme!',
            'Your repair order has been placed successfully.': 'Vaše opravná objednávka byla úspěšně odeslána.',
            "We'll contact you shortly to confirm the details.": 'Brzy vas budeme kontaktovat pro potvrzeni detailu.',
            'Back to Home': 'Zpet na uvod',
            'Continue Shopping': 'Pokracovat v nakupu',
            'Order #': 'Objednavka #',
            'Price': 'Cena',
            'Edit Order Status': 'Upravit stav objednavky',
            'Save': 'Ulozit',
            'Failed to load order details': 'Nepodarilo se nacist detaily objednavky',
            'Failed to load order: ': 'Nepodarilo se nacist objednavku: ',
            'custom PC orders': 'objednavky vlastnich sestav',
            '3D printing orders': 'objednavky 3D tisku',
            'at': 'v',
            'Customer Info': 'Informace o zakaznikovi',
            'Name': 'Jmeno',
            'No items': 'Zadne polozky',
            'Toggle menu': 'Prepnout menu',
            'CPU': 'CPU',
            'Motherboard': 'Zakladni deska',
            'RAM': 'RAM',
            'Storage': 'Uloziste',
            'PSU': 'Zdroj',
            'Cooler': 'Chladic',
            'Rack': 'Rack'
            ,
            'Czech Republic': 'Ceska republika'
        }
    };

    const i18nState = {
        lang: localStorage.getItem('lang') || 'cs',
        textMap: new Map(),
        placeholderMap: new Map(),
        ariaMap: new Map(),
        titleMap: new Map()
    };

    function withCzechDiacritics(text) {
        if (!text || typeof text !== 'string') return text;
        const replacements = [
            ['Domu', 'Domů'],
            ['Sluzby', 'Služby'],
            ['Vlastni', 'Vlastní'],
            ['O nas', 'O nás'],
            ['Prihlasit se', 'Přihlásit se'],
            ['Odhlasit se', 'Odhlásit se'],
            ['Zapomneli', 'Zapomněli'],
            ['Zpet', 'Zpět'],
            ['Zmenit', 'Změnit'],
            ['Uzivatelske', 'Uživatelské'],
            ['jmeno', 'jméno'],
            ['Jmeno', 'Jméno'],
            ['Predmet', 'Předmět'],
            ['Zprava', 'Zpráva'],
            ['Zrusit', 'Zrušit'],
            ['Podminky', 'Podmínky'],
            ['Odeslanim', 'Odesláním'],
            ['nasledujicimi', 'následujícími'],
            ['neni', 'není'],
            ['orientacni', 'orientační'],
            ['zmenit', 'změnit'],
            ['Muze', 'Může'],
            ['muze', 'může'],
            ['dojit', 'dojít'],
            ['ztrate', 'ztrátě'],
            ['zalohujte', 'zálohujte'],
            ['prosim', 'prosím'],
            ['Nevyzvednuta', 'Nevyzvednutá'],
            ['mohou byt', 'mohou být'],
            ['zlikvidovana', 'zlikvidována'],
            ['Mate-li', 'Máte-li'],
            ['Nacitam', 'Načítám'],
            ['Detaily dilu', 'Detaily dílu'],
            ['Specifikace', 'Specifikace'],
            ['Posunout nahledy', 'Posunout náhledy'],
            ['Profesionalni', 'Profesionální'],
            ['technologicka', 'technologická'],
            ['reseni', 'řešení'],
            ['Opravime', 'Opravíme'],
            ['vase', 'vaše'],
            ['zarizeni', 'zařízení'],
            ['Zarizeni', 'Zařízení'],
            ['stolnich', 'stolních'],
            ['dily', 'díly'],
            ['prislusenstvi', 'příslušenství'],
            ['Rychle', 'Rychlé'],
            ['vyrizeni', 'vyřízení'],
            ['Prohlidnout', 'Prohlédnout'],
            ['Vse', 'Vše'],
            ['miste', 'místě'],
            ['presny', 'přesný'],
            ['samy', 'samý'],
            ['Jasna', 'Jasná'],
            ['zacit', 'začít'],
            ['Vyberte', 'Vyberte'],
            ['skrin', 'skříň'],
            ['skrine', 'skříně'],
            ['uloziste', 'úložiště'],
            ['sitoveho', 'síťového'],
            ['Moznosti', 'Možnosti'],
            ['konkretni', 'konkrétní'],
            ['potreba', 'potřeba'],
            ['spolehlivy', 'spolehlivý'],
            ['Diky', 'Díky'],
            ['dlouholetym', 'dlouholetým'],
            ['zkusenostem', 'zkušenostem'],
            ['Nasi', 'Naši'],
            ['certifikovani', 'certifikovaní'],
            ['pouzivaji', 'používají'],
            ['zaruky', 'záruky'],
            ['Verime', 'Věříme'],
            ['uprimna', 'upřímná'],
            ['kvalite', 'kvalitě'],
            ['denni', 'denní'],
            ['nahradni', 'náhradní'],
            ['Prumerna', 'Průměrná'],
            ['zkusenosti', 'zkušenosti'],
            ['Najdete', 'Najdete'],
            ['Oteviraci doba', 'Otevírací doba'],
            ['Zavreno', 'Zavřeno'],
            ['Vas', 'Váš'],
            ['prazdny', 'prázdný'],
            ['Pridejte', 'Přidejte'],
            ['Mezisoucet', 'Mezisoučet'],
            ['Diagnosticky', 'Diagnostický'],
            ['Konecna', 'Konečná'],
            ['lisit', 'lišit'],
            ['Pokracovat', 'Pokračovat'],
            ['dalsi', 'další'],
            ['Pokladna', 'Pokladna'],
            ['Dokoncete', 'Dokončete'],
            ['Zpusob doruceni', 'Způsob doručení'],
            ['Osobni predani', 'Osobní předání'],
            ['Prineste', 'Přineste'],
            ['Osobni udaje', 'Osobní údaje'],
            ['Prijmeni', 'Příjmení'],
            ['Telefonni cislo', 'Telefonní číslo'],
            ['Dodaci adresa', 'Dodací adresa'],
            ['Mesto', 'Město'],
            ['Zeme', 'Země'],
            ['Poznamka', 'Poznámka'],
            ['volitelne', 'volitelně'],
            ['Specialni', 'Speciální'],
            ['poznamky', 'poznámky'],
            ['Souhlasim', 'Souhlasím'],
            ['podminkami', 'podmínkami'],
            ['ustanovenimi', 'ustanoveními'],
            ['objednavka', 'objednávka'],
            ['objednavky', 'objednávky'],
            ['Cislo', 'Číslo'],
            ['cislo', 'číslo'],
            ['zadani', 'zadání'],
            ['Pozadavky', 'Požadavky'],
            ['oznameni', 'oznámení'],
            ['Ulozit', 'Uložit'],
            ['Ceska republika', 'Česká republika'],
            ['Ceska posta', 'Česká pošta'],
            ['Jaky', 'Jaký'],
            ['pristroj', 'přístroj'],
            ['potrebuje', 'potřebuje'],
            ['zacatek', 'začátek'],
            ['znacku', 'značku'],
            ['znacky', 'značky'],
            ['Polozky', 'Položky'],
            ['polozky', 'položky'],
            ['Objednavky', 'Objednávky'],
            ['Nahrat', 'Nahrát'],
            ['nahrat', 'nahrát'],
            ['zadny', 'žádný'],
            ['Zadne', 'Žádné'],
            ['nacist', 'načíst'],
            ['Nacist', 'Načíst'],
            ['ulozit', 'uložit'],
            ['Prihlaseni', 'Přihlášení'],
            ['Uspesne', 'Úspěšně'],
            ['ohledne', 'ohledně'],
            ['vasi', 'vaší'],
            ['zobrazi', 'zobrazí'],
            ['smazany', 'smazány']
        ];

        return replacements.reduce((result, [from, to]) => {
            return result.replaceAll(from, to);
        }, text);
    }

    function t(text) {
        if (!text || i18nState.lang !== 'cs') return text;
        return withCzechDiacritics(I18N.cs[text] || text);
    }

    function translateTextNode(node, dict) {
        const raw = node.nodeValue;
        const trimmed = raw.trim();
        if (!trimmed) return;

        let translated = null;
        if (dict[trimmed]) {
            translated = withCzechDiacritics(dict[trimmed]);
        } else {
            const normalized = withCzechDiacritics(trimmed);
            if (normalized !== trimmed) {
                translated = normalized;
            }
        }

        if (!translated) return;
        if (!i18nState.textMap.has(node)) {
            i18nState.textMap.set(node, raw);
        }
        node.nodeValue = raw.replace(trimmed, translated);
    }

    function applyTranslations() {
        const dict = I18N.cs;
        document.documentElement.lang = i18nState.lang;

        if (i18nState.lang === 'cs') {
            if (dict[document.title]) {
                document.title = dict[document.title];
            }

            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                        const tag = node.parentElement.tagName;
                        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
                        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );

            let current;
            while ((current = walker.nextNode())) {
                translateTextNode(current, dict);
            }

            document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
                const placeholder = el.getAttribute('placeholder') || '';
                const translated = dict[placeholder]
                    ? withCzechDiacritics(dict[placeholder])
                    : withCzechDiacritics(placeholder);
                if (translated === placeholder) return;
                if (!i18nState.placeholderMap.has(el)) {
                    i18nState.placeholderMap.set(el, placeholder);
                }
                el.setAttribute('placeholder', translated);
            });

            document.querySelectorAll('[aria-label]').forEach(el => {
                const label = el.getAttribute('aria-label') || '';
                const translated = dict[label]
                    ? withCzechDiacritics(dict[label])
                    : withCzechDiacritics(label);
                if (translated === label) return;
                if (!i18nState.ariaMap.has(el)) {
                    i18nState.ariaMap.set(el, label);
                }
                el.setAttribute('aria-label', translated);
            });

            document.querySelectorAll('[title]').forEach(el => {
                const title = el.getAttribute('title') || '';
                const translated = dict[title]
                    ? withCzechDiacritics(dict[title])
                    : withCzechDiacritics(title);
                if (translated === title) return;
                if (!i18nState.titleMap.has(el)) {
                    i18nState.titleMap.set(el, title);
                }
                el.setAttribute('title', translated);
            });
        } else {
            i18nState.textMap.forEach((value, node) => {
                node.nodeValue = value;
            });
            i18nState.placeholderMap.forEach((value, el) => {
                el.setAttribute('placeholder', value);
            });
            i18nState.ariaMap.forEach((value, el) => {
                el.setAttribute('aria-label', value);
            });
            i18nState.titleMap.forEach((value, el) => {
                el.setAttribute('title', value);
            });
        }

        if (DOM.langToggle) {
            DOM.langToggle.textContent = i18nState.lang === 'cs' ? 'CZ' : 'EN';
        }
        const langToggleMobile = document.getElementById('langToggleMobile');
        if (langToggleMobile) {
            langToggleMobile.textContent = i18nState.lang === 'cs' ? 'CZ' : 'EN';
        }
        document.documentElement.lang = i18nState.lang;
    }

    const printingState = {
        printer: null,
        filament: null,
        colors: [],
        colorSlotIndex: 0,
        strength: null,
        parts: 1,
        fileName: ''
    };

    const defaultPrintingStrengths = [
        { id: 'standard', name: 'Standard', active: true },
        { id: 'strong', name: 'Strong', active: true },
        { id: 'high', name: 'High Strength', active: true }
    ];

    const defaultOtherItems = [
        { id: 'other-1', name: 'Servisni sluzba', desc: '', price: 0, image: '', details: 'Popis bude doplnen pozdeji.', specs: [], showContact: true, active: true },
        { id: 'other-2', name: 'Other Item 2', desc: '', price: 0, image: '', details: '', specs: [], showContact: false, active: true },
        { id: 'other-3', name: 'Other Item 3', desc: '', price: 0, image: '', details: '', specs: [], showContact: false, active: true },
        { id: 'other-4', name: 'Other Item 4', desc: '', price: 0, image: '', details: '', specs: [], showContact: false, active: true }
    ];

    const defaultUsedShopItems = [
        {
            id: 'used-notebook-1',
            name: 'Lenovo ThinkPad T14 (Repasovaný)',
            shortDesc: '14" pracovní notebook, obnovená baterie a vyčištěné chlazení.',
            details: 'Spolehlivý repasovaný notebook vhodný pro kancelář, školu i běžné použití. Zařízení je vyčištěné, otestované a po novém termálním servisu.',
            brand: 'Lenovo',
            model: 'ThinkPad T14',
            price: 8490,
            image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
            images: [
                'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=1200&q=80'
            ],
            specs: ['CPU: Intel Core i5', 'RAM: 16 GB', 'Uložiště: 512 GB SSD', 'Displej: 14" Full HD', 'OS: Windows 11 Pro'],
            active: true
        },
        {
            id: 'used-notebook-2',
            name: 'HP ProBook 450 G8 (Repasovaný)',
            shortDesc: '15.6" notebook s SSD a ověřeným stavem baterie.',
            details: 'Repasovaný notebook s vyváženým výkonem pro práci i domácí použití. Před zařazením proběhla kompletní diagnostika i zátěžový test.',
            brand: 'HP',
            model: 'ProBook 450 G8',
            price: 9290,
            image: 'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=1200&q=80',
            images: [
                'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80'
            ],
            specs: ['CPU: Intel Core i5', 'RAM: 16 GB', 'Uložiště: 512 GB SSD', 'Displej: 15.6" Full HD', 'OS: Windows 11'],
            active: true
        },
        {
            id: 'used-pc-1',
            name: 'Herní PC Ryzen 5 (Repasované)',
            shortDesc: 'Stolní PC pro 1080p hraní i práci s obsahem.',
            details: 'Repasované stolní PC s vyčištěným vnitřkem, novou teplovodivou pastou a kompletním zátěžovým testem hardwaru. Skvělá vstupní herní sestava.',
            brand: 'Custom',
            model: 'Ryzen 5 Gaming PC',
            price: 15990,
            image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=80',
            images: [
                'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=80'
            ],
            specs: ['CPU: AMD Ryzen 5', 'GPU: NVIDIA GTX 1660', 'RAM: 16 GB', 'Uložiště: 1 TB NVMe SSD', 'OS: Windows 11'],
            active: true
        }
    ];

    const defaultCheckoutOptions = {
        pickupFee: 15,
        packetaFee: 90,
        ceskaPostaFee: 0,
        pplFee: 0,
        dpdFee: 0,
        glsFee: 0,
        enableGopay: true,
        gopayFee: 0,
        enableBankTransfer: false,
        bankTransferFee: 0,
        bankTransferAccount: '',
        bankTransferIban: '',
        packetaApiKey: '',
        termsAdditionalText: '',
        adminEmailSubject: 'Aktualizace objednávky - EzFix',
        adminEmailMessage: 'Dobrý den {{customerName}},\n\nozýváme se ohledně vaší objednávky.\n\nS pozdravem,\nTým EzFix'
    };

    const BANK_TRANSFER_SPECIAL_EXTRA_CZK = 10;

    const defaultNewsItems = [
        {
            id: 'news-welcome',
            title: 'Welcome to EzFix News',
            image: 'https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=1200&q=80',
            summary: '<p>Follow updates about repairs, shop items, and new services.</p>',
            content: '<p>Here we share service updates, limited offers, and practical tips for phones, notebooks, and 3D printing.</p>',
            active: true,
            publishedAt: '2026-03-01T10:00:00.000Z',
            sortOrder: 0
        },
        {
            id: 'news-same-day',
            title: 'Same-Day Repair Slots',
            image: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=1200&q=80',
            summary: '<p>Selected repairs can now be completed the same day.</p>',
            content: '<p>We expanded technician capacity for common issues like battery replacement and charging-port repairs. Contact us early to reserve your slot.</p>',
            active: true,
            publishedAt: '2026-03-05T10:00:00.000Z',
            sortOrder: 1
        },
        {
            id: 'news-3d',
            title: 'New 3D Materials Added',
            image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
            summary: '<p>New material profiles are ready for stronger and cleaner prints.</p>',
            content: '<p>We added fresh filament options and tuned profiles for better dimensional accuracy. You can request a recommendation in chat.</p>',
            active: true,
            publishedAt: '2026-03-08T10:00:00.000Z',
            sortOrder: 2
        }
    ];

    let printingOptions = {
        printers: [
            { id: 'ender3', name: 'Creality Ender 3', desc: 'Fast, 1 color', image: 'assets/printing/ender3.svg', active: true, multicolor: false },
            { id: 'h2c', name: 'Bambu Lab H2C', desc: 'Multicolor', image: 'assets/printing/bambu-h2c.svg', active: true, multicolor: true },
            { id: 'x1c', name: 'Bambu Lab X1C Carbon', desc: 'Multicolor', image: 'assets/printing/bambu-x1c.svg', active: true, multicolor: true }
        ],
        filaments: [
            { id: 'pla', name: 'PLA', active: true },
            { id: 'petg', name: 'PETG', active: true },
            { id: 'abs', name: 'ABS', active: true },
            { id: 'tpu', name: 'TPU', active: true }
        ],
        colors: [
            { id: 'black', name: 'Black', hex: '#0f172a', active: true },
            { id: 'white', name: 'White', hex: '#f8fafc', active: true },
            { id: 'red', name: 'Red', hex: '#ef4444', active: true },
            { id: 'blue', name: 'Blue', hex: '#3b82f6', active: true },
            { id: 'green', name: 'Green', hex: '#22c55e', active: true },
            { id: 'gray', name: 'Gray', hex: '#94a3b8', active: true },
            { id: 'orange', name: 'Orange', hex: '#f97316', active: true },
            { id: 'yellow', name: 'Yellow', hex: '#facc15', active: true },
            { id: 'pink', name: 'Pink', hex: '#fb7185', active: true },
            { id: 'silver', name: 'Silver', hex: '#cbd5e1', active: true }
        ],
        strengths: defaultPrintingStrengths,
        otherItems: defaultOtherItems,
        usedShopItems: defaultUsedShopItems
    };

    let checkoutOptions = { ...defaultCheckoutOptions };
    let newsItems = [...defaultNewsItems];
    let packetaSelection = null;
    let packetaWidgetLoaderPromise = null;

    // ========================================================================
    // MODULE 2: API CONFIGURATION & HELPERS
    // API endpoints and authentication management
    // ========================================================================
    // API base resolution order:
    // 1) window.EZFIX_CONFIG.API_BASE_URL (single configurable value from index.html)
    // 2) file:// fallback to hosted API
    // 3) same-origin '/api'
    const isLocalFileMode = (location.protocol === 'file:' || location.origin === 'null');
    const configuredApiBase = (window.EZFIX_CONFIG && typeof window.EZFIX_CONFIG.API_BASE_URL === 'string')
        ? window.EZFIX_CONFIG.API_BASE_URL.trim().replace(/\/$/, '')
        : '';

    const isEzfixWebHost = /(^|\.)ezfix\.(cz|xz)$/i.test(location.hostname);
    const API_BASE_URL = configuredApiBase || (
        isLocalFileMode
            ? 'https://api.ezfix.cz/api'
            : (isEzfixWebHost ? 'https://api.ezfix.cz/api' : '/api')
    );

    /**
     * Get authorization header with JWT token
     */
    function getAuthHeader() {
        const token = localStorage.getItem('token');
        if (!token) return {};
        return { 'Authorization': `Bearer ${token}` };
    }

    /**
     * Clear authentication data
     */
    function clearAuth() {
        localStorage.removeItem('token');
        Storage.setUser(null);
        Storage.setAdminLoggedIn(false);
    }

    /**
     * Generic API call helper
     */
    async function apiCall(method, endpoint, data = null) {
        // Provide an offline/local-file fallback when the page is opened via file://
        const isLocalFile = (location.protocol === 'file:' || location.origin === 'null');
        if (isLocalFile) {
            try {
                // Local cart handling
                if (endpoint === '/cart' && method === 'GET') {
                    const cart = JSON.parse(localStorage.getItem('localCart') || '[]');
                    return { success: true, cart };
                }
                if (endpoint === '/cart' && method === 'POST') {
                    const item = Object.assign({ id: Date.now() }, data);
                    const cart = JSON.parse(localStorage.getItem('localCart') || '[]');
                    cart.push(item);
                    localStorage.setItem('localCart', JSON.stringify(cart));
                    return { success: true, cart };
                }
                if (endpoint.startsWith('/cart/') && method === 'DELETE') {
                    const id = parseInt(endpoint.split('/')[2], 10);
                    let cart = JSON.parse(localStorage.getItem('localCart') || '[]');
                    cart = cart.filter(i => i.id !== id);
                    localStorage.setItem('localCart', JSON.stringify(cart));
                    return { success: true };
                }

                // Local orders handling
                if (endpoint === '/orders' && method === 'GET') {
                    const orders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                    return { success: true, orders };
                }
                if (endpoint === '/orders' && method === 'POST') {
                    const orders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                    const orderNumber = 'LOCAL-' + Date.now();
                    const order = Object.assign({ id: Date.now(), order_number: orderNumber, created_at: new Date().toISOString() }, data);
                    orders.push(order);
                    localStorage.setItem('localOrders', JSON.stringify(orders));
                    return { success: true, order: order, orderNumber };
                }

                if (endpoint === '/orders/track' && method === 'POST') {
                    const orders = JSON.parse(localStorage.getItem('localOrders') || '[]');
                    const targetOrder = (data && data.orderNumber) ? data.orderNumber.trim() : '';
                    const targetEmail = (data && data.email) ? data.email.trim().toLowerCase() : '';
                    const match = orders.find(order => {
                        const orderEmail = (order.customer_email || order.customerEmail || '').toLowerCase();
                        return order.order_number === targetOrder && orderEmail === targetEmail;
                    });
                    if (!match) {
                        return { success: false, message: 'Order not found' };
                    }
                    return { success: true, order: Object.assign({}, match, { items: match.items || match.cartItems || [] }) };
                }

                // For other endpoints in file mode, fail fast with helpful message
                throw new Error('API unavailable in file-mode. Start the backend or open via http://localhost:3000/');
            } catch (err) {
                console.error('Local API fallback error:', err);
                throw err;
            }
        }

        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeader()
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const contentType = response.headers.get('content-type') || '';
            let result;

            if (contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                result = { success: response.ok, message: text || response.statusText, data: text };
            }

            if (!response.ok) {
                if (response.status === 401) {
                    const isSessionEndpoint = endpoint !== '/auth/login' && endpoint !== '/auth/register' && endpoint !== '/auth/forgot-password' && endpoint !== '/auth/reset-password';
                    if (isSessionEndpoint) {
                        clearAuth();
                    }
                    if (endpoint === '/auth/me') {
                        return { success: false, user: null, message: 'Unauthorized' };
                    }

                    if (isSessionEndpoint) {
                        // Only show session-expired for authenticated endpoints.
                        showToast('Session expired. Please login again.');
                        throw new Error('Session expired. Please login again.');
                    }

                    throw new Error(result.message || 'Unauthorized');
                } else if (response.status === 403) {
                    throw new Error('You do not have permission to perform this action');
                } else if (response.status === 429) {
                    throw new Error(result.message || 'Too many attempts. Please wait and try again.');
                }
            }

            if (!result.success) {
                const validationMessage = Array.isArray(result.errors) && result.errors.length
                    ? result.errors.map(err => err.msg || err.message).filter(Boolean).join('; ')
                    : '';
                throw new Error(result.message || validationMessage || 'API Error');
            }

            return result;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            // If the fetch failed due to network issues (backend not running), show a friendly toast.
            try {
                if (error && (error.message && error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
                    showToast('Cannot reach API — is the backend server running?');
                }
            } catch {
                // ignore toast errors
            }
            throw error;
        }
    }

    /**
     * Utility function to escape HTML special characters
     * Prevents XSS attacks by converting HTML characters to entities
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, char => map[char]);
    }

    function formatCurrency(value) {
        const num = typeof value === 'number' ? value : parseFloat(value);
        const safeValue = Number.isFinite(num) ? num : 0;
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK'
        }).format(safeValue);
    }

    function formatStatusLabel(status) {
        if (!status) return '';
        const normalized = String(status).replace(/-/g, ' ');
        const title = normalized
            .split(' ')
            .map(word => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
            .join(' ');
        return t(title);
    }

    function formatServiceTypeLabel(serviceType) {
        const normalized = String(serviceType || '').toLowerCase();
        if (normalized === 'pickup') return t('Pickup Service');
        if (normalized === 'zasilkovna') return t('Zasilkovna');
        if (normalized === 'ceska-posta') return t('Česká pošta');
        if (normalized === 'ppl') return t('PPL');
        if (normalized === 'dpd') return t('DPD');
        if (normalized === 'gls') return t('GLS');
        if (normalized === 'delivery') return t('Drop-off at Store');
        return serviceType || t('N/A');
    }

    function normalizePhoneForDisplay(phone) {
        const raw = String(phone || '').trim();
        if (!raw) return '';

        let normalized = raw.replace(/\s+/g, '');

        if (normalized.startsWith('+')) {
            normalized = normalized.replace(/^(\+\d{1,4})(?:\1)+/, '$1');
        }

        return normalized;
    }

    function buildCustomerPhone(countryCode, phoneInput) {
        const code = String(countryCode || '+420').replace(/\s+/g, '');
        const input = String(phoneInput || '').trim().replace(/\s+/g, '');
        if (!input) return '';

        if (input.startsWith('+')) {
            return normalizePhoneForDisplay(input);
        }

        const codeDigits = code.replace(/^\+/, '');
        let localNumber = input;
        if (codeDigits && localNumber.startsWith(codeDigits)) {
            localNumber = localNumber.slice(codeDigits.length);
        }

        return normalizePhoneForDisplay(`${code}${localNumber}`);
    }

    function normalizeOrderNumber(orderNumber) {
        return String(orderNumber || '').trim().replace(/^#/, '');
    }

    function resolveFileUrl(fileName) {
        if (!fileName) return '';
        if (/^https?:\/\//i.test(fileName)) return fileName;
        if (fileName.startsWith('/assets/')) return fileName;
        return `/assets/uploads/${fileName}`;
    }

    /**
     * Extract custom PC build details from cart/order item
     */
    function getCustomBuildDetails(item) {
        if (!item || (item.device || '').toLowerCase() !== 'custompc') return null;

        const modelValue = item.model || '';
        const repairDesc = item.repair_desc || item.repairDesc || '';
        let buildType = modelValue;
        let partsSummary = repairDesc;

        if (modelValue.includes(' | ')) {
            const parts = modelValue.split(' | ');
            buildType = parts[0] || modelValue;
            if (!partsSummary) partsSummary = parts.slice(1).join(' | ');
        }

        return {
            buildType: buildType || t('Custom PC'),
            partsSummary
        };
    }

    /**
     * Extract 3D printing details from cart/order item
     */
    function getPrintingDetails(item) {
        if (!item) return null;
        const device = (item.device || '').toLowerCase();
        if (device !== 'printing' && device !== '3d-printing') return null;

        // Handle both old single color and new multicolor format
        let colorDisplay = '';
        if (item.colorNames) {
            colorDisplay = item.colorNames;
        } else if (item.colors && Array.isArray(item.colors)) {
            colorDisplay = item.colors.map(c => c).join(', ');
        } else if (item.colorName) {
            colorDisplay = item.colorName;
        } else if (item.color) {
            colorDisplay = item.color;
        }

        return {
            printer: item.printerName || item.printer || '',
            filament: item.filamentName || item.filament || '',
            color: colorDisplay,
            strength: item.strengthName || item.strength || '',
            parts: item.parts || item.quantity || 1,
            fileName: item.fileName || item.file_name || item.file || ''
        };
    }

    /**
     * Extract Other item details from cart/order item
     */
    function getOtherItemDetails(item) {
        if (!item) return null;
        const device = (item.device || '').toLowerCase();
        if (device !== 'other' && device !== 'other-item') return null;

        return {
            name: item.otherItemName || item.name || item.repair_name || item.repairName || '',
            desc: item.otherItemDesc || item.desc || item.details || '',
            price: typeof item.price === 'number' ? item.price : (item.otherItemPrice || 0),
            image: item.otherItemImage || item.image || ''
        };
    }

    let catalogState = null;
    let catalogDraft = null;
    let newsSortMode = 'manual';
    const catalogUiState = {
        deviceKey: null,
        brandId: null,
        buildCategory: null
    };
    let catalogTabsBound = false;

    function isActiveItem(item) {
        if (!item || typeof item !== 'object') return true;
        return item.active !== false && item.hidden !== true;
    }

    function filterActiveItems(list) {
        return (list || []).filter(isActiveItem);
    }

    function getPickupFee() {
        const fee = checkoutOptions && typeof checkoutOptions.pickupFee === 'number'
            ? checkoutOptions.pickupFee
            : defaultCheckoutOptions.pickupFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.pickupFee : fee;
    }

    function getPacketaFee() {
        const fee = checkoutOptions && typeof checkoutOptions.packetaFee === 'number'
            ? checkoutOptions.packetaFee
            : defaultCheckoutOptions.packetaFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.packetaFee : fee;
    }

    function getPacketaApiKey() {
        return (checkoutOptions && checkoutOptions.packetaApiKey)
            ? String(checkoutOptions.packetaApiKey).trim()
            : '';
    }

    function getCeskaPostaFee() {
        const fee = checkoutOptions && typeof checkoutOptions.ceskaPostaFee === 'number'
            ? checkoutOptions.ceskaPostaFee
            : defaultCheckoutOptions.ceskaPostaFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.ceskaPostaFee : fee;
    }

    function getPPLFee() {
        const fee = checkoutOptions && typeof checkoutOptions.pplFee === 'number'
            ? checkoutOptions.pplFee
            : defaultCheckoutOptions.pplFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.pplFee : fee;
    }

    function getDPDFee() {
        const fee = checkoutOptions && typeof checkoutOptions.dpdFee === 'number'
            ? checkoutOptions.dpdFee
            : defaultCheckoutOptions.dpdFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.dpdFee : fee;
    }

    function getGLSFee() {
        const fee = checkoutOptions && typeof checkoutOptions.glsFee === 'number'
            ? checkoutOptions.glsFee
            : defaultCheckoutOptions.glsFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.glsFee : fee;
    }

    function getGopayFee() {
        const fee = checkoutOptions && typeof checkoutOptions.gopayFee === 'number'
            ? checkoutOptions.gopayFee
            : defaultCheckoutOptions.gopayFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.gopayFee : fee;
    }

    function isGopayEnabled() {
        if (checkoutOptions && typeof checkoutOptions.enableGopay === 'boolean') {
            return checkoutOptions.enableGopay;
        }
        return defaultCheckoutOptions.enableGopay;
    }

    function isBankTransferEnabled() {
        if (checkoutOptions && typeof checkoutOptions.enableBankTransfer === 'boolean') {
            return checkoutOptions.enableBankTransfer;
        }
        return defaultCheckoutOptions.enableBankTransfer;
    }

    function getBankTransferFee() {
        const fee = checkoutOptions && typeof checkoutOptions.bankTransferFee === 'number'
            ? checkoutOptions.bankTransferFee
            : defaultCheckoutOptions.bankTransferFee;
        return Number.isNaN(fee) ? defaultCheckoutOptions.bankTransferFee : fee;
    }

    function getBankTransferAccount() {
        return String(checkoutOptions?.bankTransferAccount || defaultCheckoutOptions.bankTransferAccount || '').trim();
    }

    function getBankTransferIban() {
        return String(checkoutOptions?.bankTransferIban || defaultCheckoutOptions.bankTransferIban || '').trim();
    }

    function updateCheckoutPaymentMethodsUi() {
        const gopayOption = document.getElementById('paymentOptionGoPay');
        const bankTransferOption = document.getElementById('paymentOptionBankTransfer');
        const gopaySection = document.getElementById('gopaySection');
        const bankTransferSection = document.getElementById('bankTransferSection');

        const gopayEnabled = isGopayEnabled();
        const bankTransferEnabled = isBankTransferEnabled();

        if (gopayOption) gopayOption.style.display = gopayEnabled ? '' : 'none';
        if (bankTransferOption) bankTransferOption.style.display = bankTransferEnabled ? '' : 'none';

        const selected = document.querySelector('input[name="paymentMethod"]:checked');
        const selectedValue = selected?.value || '';
        const selectedInvalid = (selectedValue === 'gopay' && !gopayEnabled) || (selectedValue === 'bank_transfer' && !bankTransferEnabled);

        if (!selected || selectedInvalid) {
            const fallback = document.querySelector('input[name="paymentMethod"][value="pay_on_delivery"]');
            if (fallback) fallback.checked = true;
        }

        const current = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'pay_on_delivery';
        if (gopaySection) gopaySection.style.display = current === 'gopay' && gopayEnabled ? 'block' : 'none';
        if (bankTransferSection) bankTransferSection.style.display = current === 'bank_transfer' && bankTransferEnabled ? 'block' : 'none';

        if (bankTransferSection) {
            const account = getBankTransferAccount();
            const iban = getBankTransferIban();
            const details = [
                account ? `Account: ${escapeHtml(account)}` : '',
                iban ? `IBAN: ${escapeHtml(iban)}` : ''
            ].filter(Boolean).join(' • ');

            bankTransferSection.innerHTML = details
                ? `Bank transfer instructions will be shown after order creation. ${details}`
                : 'Bank transfer instructions will be shown after order creation.';
        }
    }

    function updateCheckoutPickupFeeUi() {
        const fee = getPickupFee();
        const packetaFee = getPacketaFee();
        const ceskaPostaFee = getCeskaPostaFee();
        const pplFee = getPPLFee();
        const dpdFee = getDPDFee();
        const glsFee = getGLSFee();
        const gopayFee = getGopayFee();
        
        const labelEl = document.getElementById('pickupFeeLabel');
        const valueEl = document.getElementById('pickupFeeValue');
        const packetaLabelEl = document.getElementById('packetaFeeLabel');
        const packetaValueEl = document.getElementById('packetaFeeValue');
        const ceskaPostaLabelEl = document.getElementById('ceska-posta-fee-label');
        const ceskaPostaValueEl = document.getElementById('ceska-posta-fee-value');
        const pplLabelEl = document.getElementById('ppl-fee-label');
        const pplValueEl = document.getElementById('ppl-fee-value');
        const dpdLabelEl = document.getElementById('dpd-fee-label');
        const dpdValueEl = document.getElementById('dpd-fee-value');
        const glsLabelEl = document.getElementById('gls-fee-label');
        const glsValueEl = document.getElementById('gls-fee-value');
        const gopayLabelEl = document.getElementById('gopayFeeLabel');
        const bankTransferLabelEl = document.getElementById('bankTransferFeeLabel');
        
        if (labelEl) labelEl.textContent = formatCurrency(fee);
        if (valueEl) valueEl.textContent = formatCurrency(fee);
        if (packetaLabelEl) packetaLabelEl.textContent = formatCurrency(packetaFee);
        if (packetaValueEl) packetaValueEl.textContent = formatCurrency(packetaFee);
        if (ceskaPostaLabelEl) ceskaPostaLabelEl.textContent = formatCurrency(ceskaPostaFee);
        if (ceskaPostaValueEl) ceskaPostaValueEl.textContent = formatCurrency(ceskaPostaFee);
        if (pplLabelEl) pplLabelEl.textContent = formatCurrency(pplFee);
        if (pplValueEl) pplValueEl.textContent = formatCurrency(pplFee);
        if (dpdLabelEl) dpdLabelEl.textContent = formatCurrency(dpdFee);
        if (dpdValueEl) dpdValueEl.textContent = formatCurrency(dpdFee);
        if (glsLabelEl) glsLabelEl.textContent = formatCurrency(glsFee);
        if (glsValueEl) glsValueEl.textContent = formatCurrency(glsFee);

        if (gopayLabelEl) gopayLabelEl.textContent = formatCurrency(gopayFee);
        if (bankTransferLabelEl) bankTransferLabelEl.textContent = formatCurrency(getBankTransferFee());
        
        // Update new delivery method fees
        const ceskaPostaLabel = document.getElementById('ceska-posta-fee-label');
        if (ceskaPostaLabel) ceskaPostaLabel.textContent = formatCurrency(ceskaPostaFee);
        
        const pplLabel = document.getElementById('ppl-fee-label');
        if (pplLabel) pplLabel.textContent = formatCurrency(pplFee);
        
        const dpdLabel = document.getElementById('dpd-fee-label');
        if (dpdLabel) dpdLabel.textContent = formatCurrency(dpdFee);
        
        const glsLabel = document.getElementById('gls-fee-label');
        if (glsLabel) glsLabel.textContent = formatCurrency(glsFee);
    }

    function setPacketaSelection(point) {
        packetaSelection = point || null;
        if (point) {
            try {
                localStorage.setItem('checkout_packeta_point', JSON.stringify(point));
            } catch {
                // ignore storage errors
            }
        } else {
            localStorage.removeItem('checkout_packeta_point');
        }
        updatePacketaUi();
    }

    function updatePacketaUi() {
        const display = document.getElementById('packetaPointDisplay');
        const error = document.getElementById('packetaError');
        if (!display) return;

        // Keep the pickup-point summary interactive so users can re-open selection.
        display.setAttribute('role', 'button');
        display.setAttribute('tabindex', '0');
        display.style.cursor = 'pointer';

        if (packetaSelection && packetaSelection.name) {
            const addressParts = [packetaSelection.street, packetaSelection.city, packetaSelection.zip]
                .filter(Boolean)
                .join(', ');
            display.textContent = addressParts
                ? `${packetaSelection.name} - ${addressParts}`
                : packetaSelection.name;
        } else {
            display.textContent = t('No pickup point selected');
        }

        if (error) error.textContent = '';
    }

    function openPacketaWidget() {
        const openWidget = () => {
            const options = {
                language: i18nState.lang === 'cs' ? 'cs' : 'en'
            };

            window.Packeta.Widget.pick(apiKey, (point) => {
                if (point) setPacketaSelection(point);
            }, options);
        };

        const ensurePacketaWidgetLoaded = () => {
            if (window.Packeta && window.Packeta.Widget && typeof window.Packeta.Widget.pick === 'function') {
                return Promise.resolve();
            }

            if (packetaWidgetLoaderPromise) {
                return packetaWidgetLoaderPromise;
            }

            packetaWidgetLoaderPromise = new Promise((resolve, reject) => {
                const existingScript = document.querySelector('script[data-packeta-widget="1"]');
                if (existingScript) {
                    existingScript.addEventListener('load', () => resolve(), { once: true });
                    existingScript.addEventListener('error', () => reject(new Error('Packeta widget failed to load')), { once: true });
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://widget.packeta.com/v6/www/js/library.js';
                script.defer = true;
                script.async = true;
                script.setAttribute('data-packeta-widget', '1');
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Packeta widget failed to load'));
                document.head.appendChild(script);
            }).catch((error) => {
                packetaWidgetLoaderPromise = null;
                throw error;
            });

            return packetaWidgetLoaderPromise;
        };

        const apiKey = getPacketaApiKey();
        if (!apiKey) {
            showToast(t('Packeta API key is missing'));
            return;
        }

        ensurePacketaWidgetLoaded()
            .then(() => {
                if (!window.Packeta || !window.Packeta.Widget || typeof window.Packeta.Widget.pick !== 'function') {
                    showToast(t('Packeta widget failed to load'));
                    return;
                }
                openWidget();
            })
            .catch(() => {
                showToast(t('Packeta widget failed to load'));
            });
    }

    function updateCheckoutTotals(subtotal) {
        const pickupFeeRow = document.getElementById('pickupFeeRow');
        const packetaFeeRow = document.getElementById('packetaFeeRow');
        const ceskaPostaFeeRow = document.getElementById('ceska-posta-fee-row');
        const pplFeeRow = document.getElementById('ppl-fee-row');
        const dpdFeeRow = document.getElementById('dpd-fee-row');
        const glsFeeRow = document.getElementById('gls-fee-row');
        const paymentFeeRow = document.getElementById('paymentFeeRow');
        const paymentFeeValue = document.getElementById('paymentFeeValue');
        const checkoutTotal = document.getElementById('checkoutTotal');
        const serviceType = document.querySelector('input[name="serviceType"]:checked')?.value || 'delivery';
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'pay_on_delivery';
        
        const pickupFee = getPickupFee();
        const packetaFee = getPacketaFee();
        const ceskaPostaFee = getCeskaPostaFee();
        const pplFee = getPPLFee();
        const dpdFee = getDPDFee();
        const glsFee = getGLSFee();
        const gopayFee = getGopayFee();
        const bankTransferFee = getBankTransferFee();
        
        let deliveryFee = 0;
        let paymentFee = 0;
        
        // Hide all fee rows first
        if (pickupFeeRow) pickupFeeRow.style.display = 'none';
        if (packetaFeeRow) packetaFeeRow.style.display = 'none';
        if (ceskaPostaFeeRow) ceskaPostaFeeRow.style.display = 'none';
        if (pplFeeRow) pplFeeRow.style.display = 'none';
        if (dpdFeeRow) dpdFeeRow.style.display = 'none';
        if (glsFeeRow) glsFeeRow.style.display = 'none';
        if (paymentFeeRow) paymentFeeRow.style.display = 'none';
        
        // Show appropriate fee row based on service type
        if (serviceType === 'pickup') {
            deliveryFee = pickupFee;
            if (pickupFeeRow) pickupFeeRow.style.display = 'flex';
        } else if (serviceType === 'zasilkovna') {
            deliveryFee = packetaFee;
            if (packetaFeeRow) packetaFeeRow.style.display = 'flex';
        } else if (serviceType === 'ceska-posta') {
            deliveryFee = ceskaPostaFee;
            if (ceskaPostaFeeRow) ceskaPostaFeeRow.style.display = 'flex';
        } else if (serviceType === 'ppl') {
            deliveryFee = pplFee;
            if (pplFeeRow) pplFeeRow.style.display = 'flex';
        } else if (serviceType === 'dpd') {
            deliveryFee = dpdFee;
            if (dpdFeeRow) dpdFeeRow.style.display = 'flex';
        } else if (serviceType === 'gls') {
            deliveryFee = glsFee;
            if (glsFeeRow) glsFeeRow.style.display = 'flex';
        }

        if (paymentMethod === 'gopay' && isGopayEnabled()) {
            paymentFee = gopayFee;
            if (paymentFeeRow) paymentFeeRow.style.display = 'flex';
        } else if (paymentMethod === 'bank_transfer' && isBankTransferEnabled()) {
            paymentFee = bankTransferFee;
            if (paymentFeeRow) paymentFeeRow.style.display = 'flex';
        }

        if (paymentFeeValue) paymentFeeValue.textContent = formatCurrency(paymentFee);
        
        if (checkoutTotal) {
            checkoutTotal.textContent = formatCurrency(subtotal + deliveryFee + paymentFee);
        }
    }

    function applyCatalog(catalog) {
        if (!catalog || typeof catalog !== 'object') return;
        catalogState = catalog;
        newsSortMode = String(catalog.newsSortMode || 'manual').toLowerCase() === 'newest' ? 'newest' : 'manual';

        if (catalog.services && typeof catalog.services === 'object') {
            serviceData = catalog.services;
        }
        if (catalog.customBuilds && typeof catalog.customBuilds === 'object') {
            customPCParts = {
                ...customPCParts,
                ...catalog.customBuilds
            };
        }
        if (catalog.printing && typeof catalog.printing === 'object') {
            // Preserve default printer properties (like multicolor) if not in catalog
            const defaultPrinters = printingOptions.printers || [];
            const catalogPrinters = catalog.printing.printers || [];
            
            // Merge catalog printers with defaults, preserving multicolor property
            const mergedPrinters = catalogPrinters.map(catPrinter => {
                const defaultPrinter = defaultPrinters.find(dp => dp.id === catPrinter.id);
                if (defaultPrinter && !catPrinter.hasOwnProperty('multicolor')) {
                    return { ...catPrinter, multicolor: defaultPrinter.multicolor };
                }
                return catPrinter;
            });
            
            printingOptions = {
                ...catalog.printing,
                printers: mergedPrinters
            };
            
            if (!Array.isArray(printingOptions.strengths) || printingOptions.strengths.length === 0) {
                printingOptions.strengths = defaultPrintingStrengths;
            }
            if (!Array.isArray(printingOptions.otherItems) || printingOptions.otherItems.length === 0) {
                printingOptions.otherItems = defaultOtherItems;
            }
            if (!Array.isArray(printingOptions.usedShopItems) || printingOptions.usedShopItems.length === 0) {
                printingOptions.usedShopItems = defaultUsedShopItems;
            }
        }
        if (catalog.checkout && typeof catalog.checkout === 'object') {
            checkoutOptions = { ...defaultCheckoutOptions, ...catalog.checkout };
        } else {
            checkoutOptions = { ...defaultCheckoutOptions };
        }
        newsItems = normalizeNewsItems(catalog.news);
        if (!newsItems.length) {
            newsItems = normalizeNewsItems(defaultNewsItems);
        }
        updateCheckoutPickupFeeUi();
        updateCheckoutPaymentMethodsUi();
        const checkoutPage = document.getElementById('checkout');
        if (checkoutPage && checkoutPage.classList.contains('active')) {
            const subtotal = (Storage.cart || []).reduce((sum, item) => sum + (Number(item?.price) || 0), 0);
            updateCheckoutTotals(subtotal);
        }
        renderTermsModalContent();
        renderAnnouncementBanner(catalog.announcement || {});
        renderHomeNewsSection(newsItems);
        applySocialLinks(catalog.socialLinks || {});
    }

    async function loadCatalog() {
        try {
            const result = await apiCall('GET', '/catalog');
            if (result && result.success && result.catalog) {
                applyCatalog(result.catalog);
            }
        } catch (err) {
            console.warn('Catalog load failed:', err.message || err);
        }
    }

    function applySocialLinks(socialLinks) {
        const insta = String(socialLinks?.instagram || '').trim();
        const fb = String(socialLinks?.facebook || '').trim();
        ['footerInstagram', 'navInstagram'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (insta) { el.href = insta; el.style.display = 'flex'; }
            else { el.style.display = 'none'; }
        });
        ['footerFacebook', 'navFacebook'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (fb) { el.href = fb; el.style.display = 'flex'; }
            else { el.style.display = 'none'; }
        });
        const adminInsta = document.getElementById('adminInstagramUrl');
        const adminFb = document.getElementById('adminFacebookUrl');
        if (adminInsta && !adminInsta.dataset.edited) adminInsta.value = insta;
        if (adminFb && !adminFb.dataset.edited) adminFb.value = fb;
    }

    function cloneCatalog() {
        return JSON.parse(JSON.stringify({
            services: serviceData,
            customBuilds: customPCParts,
            printing: printingOptions,
            checkout: checkoutOptions,
            announcement: catalogState?.announcement || { active: false, text: '' },
            newsSortMode,
            news: Array.isArray(newsItems) ? newsItems : [],
            socialLinks: catalogState?.socialLinks || { instagram: '', facebook: '' }
        }));
    }

    function renderTermsModalContent() {
        const container = document.getElementById('termsCustomText');
        if (!container) return;

        container.innerHTML = '';
        const customText = (checkoutOptions && typeof checkoutOptions.termsAdditionalText === 'string')
            ? checkoutOptions.termsAdditionalText.trim()
            : '';

        if (!customText) return;

        customText
            .split(/\r?\n+/)
            .map(line => line.trim())
            .filter(Boolean)
            .forEach(line => {
                const paragraph = document.createElement('p');
                paragraph.textContent = line;
                container.appendChild(paragraph);
            });
    }

    function renderAnnouncementBanner(announcement) {
        const banner = document.getElementById('announcementBanner');
        const textEl = document.getElementById('announcementText');
        const closeBtn = document.getElementById('announcementCloseBtn');
        if (!banner || !textEl) return;

        const dismissalKey = 'announcementDismissedText';

        const syncAnnouncementOffset = () => {
            const visible = !banner.classList.contains('hidden');
            const height = visible ? Math.ceil(banner.getBoundingClientRect().height || 0) : 0;
            document.documentElement.style.setProperty('--announcement-height', `${height}px`);
        };

        const closeAnnouncementBanner = () => {
            const currentText = String(textEl.textContent || '').trim();
            try {
                if (currentText) localStorage.setItem(dismissalKey, currentText);
            } catch {
                // Ignore storage errors and still hide visually.
            }
            banner.classList.add('hidden');
            document.body.classList.remove('has-announcement');
            syncAnnouncementOffset();
        };

        const isActive = announcement && announcement.active && announcement.text;
        if (isActive) {
            const messageText = String(announcement.text || '').trim();
            textEl.textContent = messageText;

            let dismissedText = '';
            try {
                dismissedText = localStorage.getItem(dismissalKey) || '';
            } catch {
                dismissedText = '';
            }

            const isDismissed = dismissedText && dismissedText === messageText;
            if (isDismissed) {
                banner.classList.add('hidden');
                document.body.classList.remove('has-announcement');
            } else {
                banner.classList.remove('hidden');
                document.body.classList.add('has-announcement');
            }

            requestAnimationFrame(syncAnnouncementOffset);

            if (closeBtn && !closeBtn.dataset.bound) {
                closeBtn.dataset.bound = '1';
                closeBtn.addEventListener('click', closeAnnouncementBanner);
                closeBtn.addEventListener('touchend', (event) => {
                    event.preventDefault();
                    closeAnnouncementBanner();
                }, { passive: false });
            }

            if (!window.__announcementResizeBound) {
                window.__announcementResizeBound = true;
                window.addEventListener('resize', () => {
                    requestAnimationFrame(syncAnnouncementOffset);
                });
            }
        } else {
            banner.classList.add('hidden');
            document.body.classList.remove('has-announcement');
            syncAnnouncementOffset();
        }
    }

    function sanitizeNewsHtml(value) {
        const raw = String(value || '');
        return raw
            .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
            .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
            .replace(/javascript:/gi, '');
    }

    function stripNewsHtml(value) {
        return String(value || '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function buildNewsSummaryFallback(contentHtml) {
        const plain = stripNewsHtml(contentHtml);
        if (!plain) return '';
        const shortened = plain.length > 180 ? `${plain.slice(0, 177).trimEnd()}...` : plain;
        return `<p>${escapeHtml(shortened)}</p>`;
    }

    function getNewsSummaryMetrics(item) {
        const customSummary = String(item?.summary || '').trim();
        const isFallback = !customSummary;
        const summaryHtml = customSummary || buildNewsSummaryFallback(String(item?.content || ''));
        const summaryChars = stripNewsHtml(summaryHtml).length;
        return {
            isFallback,
            summaryHtml,
            summaryChars
        };
    }

    function buildNewsSignature(payload) {
        const normalizedItems = normalizeNewsItems(payload?.news || []);
        return JSON.stringify({
            newsSortMode: String(payload?.newsSortMode || 'manual').toLowerCase() === 'newest' ? 'newest' : 'manual',
            news: normalizedItems
        });
    }

    function updateCatalogNewsDirtyIndicator() {
        const tabBtn = document.querySelector('.catalog-tab-btn[data-catalog-tab="news"]');
        if (!tabBtn || !catalogDraft) return;

        const draftSignature = buildNewsSignature(catalogDraft);
        const savedSignature = buildNewsSignature(catalogState || { news: newsItems, newsSortMode });
        tabBtn.classList.toggle('has-unsaved', draftSignature !== savedSignature);
    }

    function normalizeNewsItems(items) {
        const source = Array.isArray(items) ? items : [];
        return source.map((item, index) => {
            const content = sanitizeNewsHtml(String(item?.content || ''));
            const providedSummary = sanitizeNewsHtml(String(item?.summary || ''));
            return {
                id: String(item?.id || `news-${Date.now()}-${index}`),
                title: String(item?.title || '').trim() || `News ${index + 1}`,
                image: String(item?.image || '').trim(),
                summary: providedSummary.trim() || buildNewsSummaryFallback(content),
                content,
                active: item?.active !== false,
                publishedAt: Number.isFinite(new Date(item?.publishedAt || '').getTime())
                    ? new Date(item.publishedAt).toISOString()
                    : null,
                sortOrder: Number.isFinite(Number(item?.sortOrder))
                    ? Math.max(0, Math.floor(Number(item.sortOrder)))
                    : index
            };
        });
    }

    function toDateTimeLocalInputValue(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (!Number.isFinite(date.getTime())) return '';
        const pad = (value) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    function fromDateTimeLocalInputValue(value) {
        const text = String(value || '').trim();
        if (!text) return null;
        const date = new Date(text);
        return Number.isFinite(date.getTime()) ? date.toISOString() : null;
    }

    function formatNewsDateLabel(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (!Number.isFinite(date.getTime())) return '';
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function sortNewsItems(items) {
        const sorted = [...normalizeNewsItems(items)];
        const mode = newsSortMode === 'newest' ? 'newest' : 'manual';
        sorted.sort((a, b) => {
            const timeA = Number.isFinite(new Date(a.publishedAt || '').getTime()) ? new Date(a.publishedAt).getTime() : 0;
            const timeB = Number.isFinite(new Date(b.publishedAt || '').getTime()) ? new Date(b.publishedAt).getTime() : 0;
            if (mode === 'newest' && timeA !== timeB) return timeB - timeA;
            const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
            if (orderDiff !== 0) return orderDiff;
            if (timeA !== timeB) return timeB - timeA;
            return catalogTextSorter.compare(String(a.title || ''), String(b.title || ''));
        });
        return sorted;
    }

    function isNewsPublished(item, now = Date.now()) {
        const publishedTime = Number.isFinite(new Date(item?.publishedAt || '').getTime())
            ? new Date(item.publishedAt).getTime()
            : null;
        return publishedTime === null || publishedTime <= now;
    }

    function renderHomeNewsSection(items = []) {
        const listEl = document.getElementById('homeNewsList');
        if (!listEl) return;

        const now = Date.now();
        const activeNews = sortNewsItems(items).filter((item) => item.active !== false && isNewsPublished(item, now));
        if (!activeNews.length) {
            listEl.innerHTML = '';
            return;
        }

        listEl.innerHTML = activeNews.map((item) => `
            <article class="home-news-card ${item.image ? '' : 'no-image'}">
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="home-news-image" width="1200" height="675" loading="lazy" decoding="async" fetchpriority="low">` : ''}
                <div class="home-news-body">
                    ${item.publishedAt ? `<p class="home-news-date">${escapeHtml(formatNewsDateLabel(item.publishedAt))}</p>` : ''}
                    <h3 class="home-news-title">${escapeHtml(item.title)}</h3>
                    <div class="home-news-summary">${item.summary || ''}</div>
                    <div class="home-news-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-news-detail-id="${escapeHtml(item.id)}">Detail</button>
                    </div>
                </div>
            </article>
        `).join('');
    }

    function closeNewsDetailsModal() {
        const modal = document.getElementById('newsDetailsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function openNewsDetailsModal(newsId) {
        const modal = document.getElementById('newsDetailsModal');
        const titleEl = document.getElementById('newsDetailsTitle');
        const bodyEl = document.getElementById('newsDetailsBody');
        if (!modal || !titleEl || !bodyEl) return;

        const now = Date.now();
        const entry = sortNewsItems(newsItems || []).find((item) => String(item.id) === String(newsId) && item.active !== false && isNewsPublished(item, now));
        if (!entry) return;

        titleEl.textContent = entry.title || 'News';
        bodyEl.innerHTML = `
            ${entry.image ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title || 'News')}" class="news-details-hero" width="1200" height="675" decoding="async">` : ''}
            ${entry.publishedAt ? `<p class="news-details-date">${escapeHtml(formatNewsDateLabel(entry.publishedAt))}</p>` : ''}
            <div class="news-details-content">${entry.content || entry.summary || ''}</div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function initHomeNewsUi() {
        const overlay = document.getElementById('newsDetailsOverlay');
        const closeBtn = document.getElementById('newsDetailsClose');

        overlay?.addEventListener('click', closeNewsDetailsModal);
        closeBtn?.addEventListener('click', closeNewsDetailsModal);

        document.addEventListener('click', (event) => {
            const detailBtn = event.target.closest('[data-news-detail-id]');
            if (!detailBtn) return;
            const newsId = detailBtn.getAttribute('data-news-detail-id');
            if (newsId) {
                openNewsDetailsModal(newsId);
            }
        });
    }

    function slugify(value) {
        return String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 40);
    }

    function formatLabel(value) {
        return String(value || '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, match => match.toUpperCase());
    }

    function ensureCatalogState() {
        if (!catalogDraft) {
            catalogDraft = cloneCatalog();
        }
    }

    function getServiceKeys() {
        return Object.keys(catalogDraft.services || {});
    }

    function getBuildCategories() {
        const builds = catalogDraft.customBuilds || {};
        return Object.keys(builds).filter(key => Array.isArray(builds[key]));
    }

    function setDefaultCatalogUiState() {
        const serviceKeys = getServiceKeys();
        if (!catalogUiState.deviceKey && serviceKeys.length) {
            catalogUiState.deviceKey = serviceKeys[0];
        }

        const device = catalogDraft.services[catalogUiState.deviceKey] || {};
        const brands = device.brands || [];
        if (!catalogUiState.brandId && brands.length) {
            catalogUiState.brandId = brands[0].id;
        }

        const buildCategories = getBuildCategories();
        if (!catalogUiState.buildCategory && buildCategories.length) {
            catalogUiState.buildCategory = buildCategories[0];
        }
    }

    function renderCatalogTabs() {
        if (catalogTabsBound) return;
        catalogTabsBound = true;
        document.querySelectorAll('.catalog-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.catalogTab;
                document.querySelectorAll('.catalog-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.catalog-panel').forEach(panel => panel.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`catalog-${tab}`)?.classList.add('active');
                renderCatalogTabContent(tab);
            });
        });
    }

    function renderCatalogTabContent(tab) {
        const startedAt = performance.now();
        if (tab === 'repairs') {
            renderCatalogRepairs();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'builds') {
            renderCatalogBuilds();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'printing') {
            renderCatalogPrinting();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'other-items') {
            renderCatalogOtherItems();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'used-shop') {
            renderCatalogUsedShop();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'checkout' || tab === 'email') {
            renderCatalogCheckout();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'news') {
            renderCatalogNews();
            logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
            return;
        }
        if (tab === 'advanced') {
            renderCatalogAdvanced();
        }
        logPerfMetric('catalog-tab-render', performance.now() - startedAt, { tab });
    }

    function renderCatalogAdvanced() {
        const servicesInput = document.getElementById('catalogServicesInput');
        const buildsInput = document.getElementById('catalogBuildsInput');
        const printingInput = document.getElementById('catalogPrintingInput');
        const checkoutInput = document.getElementById('catalogCheckoutInput');
        const newsInput = document.getElementById('catalogNewsInput');
        if (!servicesInput || !buildsInput || !printingInput || !checkoutInput || !newsInput) return;
        servicesInput.value = JSON.stringify(catalogDraft.services, null, 2);
        buildsInput.value = JSON.stringify(catalogDraft.customBuilds, null, 2);
        printingInput.value = JSON.stringify(catalogDraft.printing, null, 2);
        checkoutInput.value = JSON.stringify(catalogDraft.checkout || defaultCheckoutOptions, null, 2);
        newsInput.value = JSON.stringify(catalogDraft.news || [], null, 2);
    }

    function renderCatalogCheckout() {
        const pickupInput = document.getElementById('catalogPickupFee');
        const packetaFeeInput = document.getElementById('catalogPacketaFee');
        const ceskaPostaFeeInput = document.getElementById('catalogCeskaPostaFee');
        const pplFeeInput = document.getElementById('catalogPPLFee');
        const dpdFeeInput = document.getElementById('catalogDPDFee');
        const glsFeeInput = document.getElementById('catalogGLSFee');
        const gopayFeeInput = document.getElementById('catalogGopayFee');
        const enableGopayInput = document.getElementById('catalogEnableGopay');
        const enableBankTransferInput = document.getElementById('catalogEnableBankTransfer');
        const bankTransferFeeInput = document.getElementById('catalogBankTransferFee');
        const bankTransferAccountInput = document.getElementById('catalogBankTransferAccount');
        const bankTransferIbanInput = document.getElementById('catalogBankTransferIban');
        const packetaKeyInput = document.getElementById('catalogPacketaApiKey');
        const termsAdditionalTextInput = document.getElementById('catalogTermsAdditionalText');
        const adminEmailSubjectInput = document.getElementById('catalogAdminEmailSubject');
        const adminEmailMessageInput = document.getElementById('catalogAdminEmailMessage');
        
        if (!pickupInput || !packetaFeeInput || !packetaKeyInput) return;

        if (!catalogDraft.checkout || typeof catalogDraft.checkout !== 'object') {
            catalogDraft.checkout = { ...defaultCheckoutOptions };
        }

        pickupInput.value = catalogDraft.checkout.pickupFee ?? defaultCheckoutOptions.pickupFee;
        packetaFeeInput.value = catalogDraft.checkout.packetaFee ?? defaultCheckoutOptions.packetaFee;
        ceskaPostaFeeInput.value = catalogDraft.checkout.ceskaPostaFee ?? defaultCheckoutOptions.ceskaPostaFee;
        pplFeeInput.value = catalogDraft.checkout.pplFee ?? defaultCheckoutOptions.pplFee;
        dpdFeeInput.value = catalogDraft.checkout.dpdFee ?? defaultCheckoutOptions.dpdFee;
        glsFeeInput.value = catalogDraft.checkout.glsFee ?? defaultCheckoutOptions.glsFee;
        if (gopayFeeInput) gopayFeeInput.value = catalogDraft.checkout.gopayFee ?? defaultCheckoutOptions.gopayFee;
        if (enableGopayInput) enableGopayInput.checked = catalogDraft.checkout.enableGopay ?? defaultCheckoutOptions.enableGopay;
        if (enableBankTransferInput) enableBankTransferInput.checked = catalogDraft.checkout.enableBankTransfer ?? defaultCheckoutOptions.enableBankTransfer;
        if (bankTransferFeeInput) bankTransferFeeInput.value = catalogDraft.checkout.bankTransferFee ?? defaultCheckoutOptions.bankTransferFee;
        if (bankTransferAccountInput) bankTransferAccountInput.value = catalogDraft.checkout.bankTransferAccount ?? defaultCheckoutOptions.bankTransferAccount;
        if (bankTransferIbanInput) bankTransferIbanInput.value = catalogDraft.checkout.bankTransferIban ?? defaultCheckoutOptions.bankTransferIban;
        packetaKeyInput.value = catalogDraft.checkout.packetaApiKey ?? '';
        if (termsAdditionalTextInput) {
            termsAdditionalTextInput.value = catalogDraft.checkout.termsAdditionalText ?? '';
        }
        if (adminEmailSubjectInput) {
            adminEmailSubjectInput.value = catalogDraft.checkout.adminEmailSubject ?? defaultCheckoutOptions.adminEmailSubject;
        }
        if (adminEmailMessageInput) {
            adminEmailMessageInput.value = catalogDraft.checkout.adminEmailMessage ?? defaultCheckoutOptions.adminEmailMessage;
        }

        pickupInput.oninput = () => {
            const parsed = parseFloat(pickupInput.value);
            catalogDraft.checkout.pickupFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        packetaFeeInput.oninput = () => {
            const parsed = parseFloat(packetaFeeInput.value);
            catalogDraft.checkout.packetaFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        ceskaPostaFeeInput.oninput = () => {
            const parsed = parseFloat(ceskaPostaFeeInput.value);
            catalogDraft.checkout.ceskaPostaFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        pplFeeInput.oninput = () => {
            const parsed = parseFloat(pplFeeInput.value);
            catalogDraft.checkout.pplFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        dpdFeeInput.oninput = () => {
            const parsed = parseFloat(dpdFeeInput.value);
            catalogDraft.checkout.dpdFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        glsFeeInput.oninput = () => {
            const parsed = parseFloat(glsFeeInput.value);
            catalogDraft.checkout.glsFee = Number.isNaN(parsed) ? 0 : parsed;
        };
        if (gopayFeeInput) {
            gopayFeeInput.oninput = () => {
                const parsed = parseFloat(gopayFeeInput.value);
                catalogDraft.checkout.gopayFee = Number.isNaN(parsed) ? 0 : parsed;
            };
        }
        if (enableGopayInput) {
            enableGopayInput.onchange = () => {
                catalogDraft.checkout.enableGopay = Boolean(enableGopayInput.checked);
            };
        }
        if (enableBankTransferInput) {
            enableBankTransferInput.onchange = () => {
                catalogDraft.checkout.enableBankTransfer = Boolean(enableBankTransferInput.checked);
            };
        }
        if (bankTransferFeeInput) {
            bankTransferFeeInput.oninput = () => {
                const parsed = parseFloat(bankTransferFeeInput.value);
                catalogDraft.checkout.bankTransferFee = Number.isNaN(parsed) ? 0 : parsed;
            };
        }
        if (bankTransferAccountInput) {
            bankTransferAccountInput.oninput = () => {
                catalogDraft.checkout.bankTransferAccount = bankTransferAccountInput.value.trim();
            };
        }
        if (bankTransferIbanInput) {
            bankTransferIbanInput.oninput = () => {
                catalogDraft.checkout.bankTransferIban = bankTransferIbanInput.value.trim();
            };
        }
        packetaKeyInput.oninput = () => {
            catalogDraft.checkout.packetaApiKey = packetaKeyInput.value.trim();
        };
        if (termsAdditionalTextInput) {
            termsAdditionalTextInput.oninput = () => {
                catalogDraft.checkout.termsAdditionalText = termsAdditionalTextInput.value;
            };
        }
        if (adminEmailSubjectInput) {
            adminEmailSubjectInput.oninput = () => {
                catalogDraft.checkout.adminEmailSubject = adminEmailSubjectInput.value;
            };
        }
        if (adminEmailMessageInput) {
            adminEmailMessageInput.oninput = () => {
                catalogDraft.checkout.adminEmailMessage = adminEmailMessageInput.value;
            };
        }
    }

    function buildAdminEmailDraft(customerName) {
        const safeName = String(customerName || '').trim();
        const defaultSubject = t('Order Update - EzFix');
        const defaultMessage = `${t('Hi')} ${safeName || t('Customer')},\n\n${t('We wanted to follow up on your order.')}\n\n${t('Best regards,')}\n${t('EzFix Team')}`;

        const subjectTemplate = typeof checkoutOptions?.adminEmailSubject === 'string'
            ? checkoutOptions.adminEmailSubject
            : '';
        const bodyTemplate = typeof checkoutOptions?.adminEmailMessage === 'string'
            ? checkoutOptions.adminEmailMessage
            : '';

        const replaceName = (value) => String(value || '').replace(/\{\{\s*customerName\s*\}\}/gi, safeName || t('Customer'));

        const subject = replaceName(subjectTemplate).trim() || defaultSubject;
        const message = replaceName(bodyTemplate).trim() || defaultMessage;

        return { subject, message };
    }

    window.buildAdminEmailDraft = buildAdminEmailDraft;

    const catalogTextSorter = new Intl.Collator('cs', { numeric: true, sensitivity: 'base' });
    const catalogSortByText = (left, right) => catalogTextSorter.compare(String(left || '').trim(), String(right || '').trim());
    const catalogSortByName = (a, b) => {
        const left = String(((a && a.name) || (a && a.id) || '').trim());
        const right = String(((b && b.name) || (b && b.id) || '').trim());
        return catalogTextSorter.compare(left, right);
    };
    const catalogNormalizeModelName = (record) => String(typeof record === 'string' ? record : (record && (record.name || record.id)) || '').trim();

    function renderCatalogRepairs() {
        const deviceSelect = document.getElementById('catalogDeviceSelect');
        const brandList = document.getElementById('catalogBrandList');
        const brandSelect = document.getElementById('catalogBrandSelect');
        const modelList = document.getElementById('catalogModelList');
        const repairList = document.getElementById('catalogRepairList');
        const addBrandBtn = document.getElementById('catalogAddBrand');
        const addModelBtn = document.getElementById('catalogAddModel');
        const addRepairBtn = document.getElementById('catalogAddRepair');
        if (!deviceSelect || !brandList || !brandSelect || !modelList || !repairList) return;

        if (addBrandBtn) addBrandBtn.textContent = 'Přidat značku';
        if (addModelBtn) addModelBtn.textContent = 'Přidat model';
        if (addRepairBtn) addRepairBtn.textContent = 'Přidat opravu';

        const serviceKeys = getServiceKeys().slice().sort(catalogSortByText);
        if (!serviceKeys.includes(catalogUiState.deviceKey)) {
            catalogUiState.deviceKey = serviceKeys[0] || null;
        }
        deviceSelect.innerHTML = serviceKeys.map(key => `<option value="${key}">${formatLabel(key)}</option>`).join('');
        deviceSelect.value = catalogUiState.deviceKey || '';

        const device = catalogDraft.services[catalogUiState.deviceKey] || {};
        const brands = device.brands || [];
        brands.sort(catalogSortByName);

        brandSelect.innerHTML = brands.map(brand => `<option value="${brand.id}">${brand.name}</option>`).join('');
        if (!brands.find(b => b.id === catalogUiState.brandId) && brands.length) {
            catalogUiState.brandId = brands[0].id;
        }
        brandSelect.value = catalogUiState.brandId || '';

        brandList.innerHTML = brands.map((brand, index) => `
            <div class="catalog-item" data-index="${index}" data-type="brand">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${brand.id}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${brand.name}" data-field="name" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${brand.active === false ? '' : 'checked'} />
                    <span>Aktivní</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Smazat</button>
                </div>
            </div>
        `).join('');

        const models = device.models && device.models[catalogUiState.brandId]
            ? device.models[catalogUiState.brandId]
            : [];
        models.sort((a, b) => catalogTextSorter.compare(catalogNormalizeModelName(a), catalogNormalizeModelName(b)));

        modelList.innerHTML = models.map((model, index) => {
            const modelName = typeof model === 'string' ? model : (model.name || '');
            const modelActive = typeof model === 'string' ? true : model.active !== false;
            return `
                <div class="catalog-item" data-index="${index}" data-type="model">
                    <div>
                        <label>Model</label>
                        <input class="catalog-input" value="${modelName}" data-field="name" />
                    </div>
                    <div class="toggle">
                        <input type="checkbox" data-field="active" ${modelActive ? 'checked' : ''} />
                        <span>Aktivní</span>
                    </div>
                    <div class="inline-actions">
                        <button class="btn btn-sm btn-secondary" data-action="delete">Smazat</button>
                    </div>
                </div>
            `;
        }).join('');

        const repairs = device.repairs || [];
        repairs.sort(catalogSortByName);
        repairList.innerHTML = repairs.map((repair, index) => `
            <div class="catalog-item" data-index="${index}" data-type="repair">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${repair.id}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${repair.name}" data-field="name" />
                </div>
                <div>
                    <label>Description</label>
                    <input class="catalog-input" value="${repair.desc || ''}" data-field="desc" />
                </div>
                <div>
                    <label>Price</label>
                    <input class="catalog-input" value="${repair.price || ''}" data-field="price" />
                </div>
                <div>
                    <label>Icon</label>
                    <input class="catalog-input" value="${repair.icon || ''}" data-field="icon" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${repair.active === false ? '' : 'checked'} />
                    <span>Aktivní</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Smazat</button>
                </div>
            </div>
        `).join('');

        deviceSelect.onchange = () => {
            catalogUiState.deviceKey = deviceSelect.value;
            const deviceData = catalogDraft.services[catalogUiState.deviceKey] || {};
            const nextBrands = deviceData.brands || [];
            catalogUiState.brandId = nextBrands.length ? nextBrands[0].id : null;
            renderCatalogRepairs();
        };

        brandSelect.onchange = () => {
            catalogUiState.brandId = brandSelect.value;
            renderCatalogRepairs();
        };

        modelList.querySelectorAll('.catalog-item').forEach(item => {
            item.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => {
                    const index = parseInt(item.dataset.index, 10);
                    const field = input.dataset.field;
                    const deviceData = catalogDraft.services[catalogUiState.deviceKey] || {};
                    if (!deviceData.models) deviceData.models = {};
                    const list = deviceData.models[catalogUiState.brandId] || [];
                    const record = list[index];
                    const value = input.type === 'checkbox' ? input.checked : input.value;

                    if (typeof record === 'string') {
                        list[index] = { name: record, active: true };
                    }
                    const normalized = list[index];
                    if (field === 'active') {
                        normalized.active = value;
                    } else if (field === 'name') {
                        normalized.name = value;
                    }
                    deviceData.models[catalogUiState.brandId] = list;
                });
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                const deviceData = catalogDraft.services[catalogUiState.deviceKey] || {};
                if (!deviceData.models) deviceData.models = {};
                const list = deviceData.models[catalogUiState.brandId] || [];
                list.splice(index, 1);
                deviceData.models[catalogUiState.brandId] = list;
                renderCatalogRepairs();
            });
        });

        brandList.querySelectorAll('.catalog-item').forEach(item => {
            item.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => {
                    const index = parseInt(item.dataset.index, 10);
                    const field = input.dataset.field;
                    const value = input.type === 'checkbox' ? input.checked : input.value;
                    const brand = brands[index];
                    if (!brand) return;
                    if (field === 'active') {
                        brand.active = value;
                    } else if (field === 'name') {
                        brand.name = value;
                    }
                });
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                brands.splice(index, 1);
                renderCatalogRepairs();
            });
        });

        repairList.querySelectorAll('.catalog-item').forEach(item => {
            item.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => {
                    const index = parseInt(item.dataset.index, 10);
                    const field = input.dataset.field;
                    const repair = repairs[index];
                    if (!repair) return;
                    const value = input.type === 'checkbox' ? input.checked : input.value;
                    if (field === 'price') {
                        const num = parseFloat(value);
                        repair.price = Number.isNaN(num) ? 0 : num;
                    } else if (field === 'active') {
                        repair.active = value;
                    } else {
                        repair[field] = value;
                    }
                });
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                repairs.splice(index, 1);
                renderCatalogRepairs();
            });
        });
    }

    function renderCatalogBuilds() {
        const categorySelect = document.getElementById('catalogBuildCategorySelect');
        const list = document.getElementById('catalogBuildList');
        const osDescriptionInput = document.getElementById('catalogBuildOsDescription');
        if (!categorySelect || !list) return;

        if (typeof catalogDraft.customBuilds.osOptionDescription !== 'string') {
            catalogDraft.customBuilds.osOptionDescription = customPCParts.osOptionDescription || '';
        }
        if (osDescriptionInput) {
            osDescriptionInput.value = catalogDraft.customBuilds.osOptionDescription;
            osDescriptionInput.oninput = () => {
                catalogDraft.customBuilds.osOptionDescription = osDescriptionInput.value;
            };
        }

        const categories = getBuildCategories().slice().sort(catalogSortByText);
        if (!categories.includes(catalogUiState.buildCategory)) {
            catalogUiState.buildCategory = categories[0] || null;
        }
        categorySelect.innerHTML = categories.map(key => `<option value="${key}">${formatLabel(key)}</option>`).join('');
        categorySelect.value = catalogUiState.buildCategory || '';
        catalogUiState.buildCategory = categorySelect.value;

        const items = catalogDraft.customBuilds[catalogUiState.buildCategory] || [];
        items.sort(catalogSortByName);
        list.innerHTML = items.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="build-item">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div>
                    <label>Price</label>
                    <input class="catalog-input" value="${item.price || ''}" data-field="price" />
                </div>
                <div>
                    <label>Images (comma)</label>
                    <input class="catalog-input" value="${(item.images || []).join(', ')}" data-field="images" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        categorySelect.onchange = () => {
            catalogUiState.buildCategory = categorySelect.value;
            renderCatalogBuilds();
        };

        list.querySelectorAll('.catalog-item').forEach(item => {
            item.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => {
                    const index = parseInt(item.dataset.index, 10);
                    const field = input.dataset.field;
                    const buildItem = items[index];
                    if (!buildItem) return;
                    const value = input.type === 'checkbox' ? input.checked : input.value;
                    if (field === 'price') {
                        const num = parseFloat(value);
                        buildItem.price = Number.isNaN(num) ? 0 : num;
                    } else if (field === 'images') {
                        buildItem.images = value.split(',').map(v => v.trim()).filter(Boolean);
                    } else if (field === 'active') {
                        buildItem.active = value;
                    } else if (field === 'name') {
                        buildItem.name = value;
                    }
                });
            });
            item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                items.splice(index, 1);
                renderCatalogBuilds();
            });
        });
    }

    function renderCatalogPrinting() {
        const printersList = document.getElementById('catalogPrintersList');
        const filamentsList = document.getElementById('catalogFilamentsList');
        const colorsList = document.getElementById('catalogColorsList');
        if (!printersList || !filamentsList || !colorsList) return;

        const printers = catalogDraft.printing.printers || [];
        const filaments = catalogDraft.printing.filaments || [];
        const colors = catalogDraft.printing.colors || [];

        printers.sort(catalogSortByName);
        filaments.sort(catalogSortByName);
        colors.sort(catalogSortByName);

        printersList.innerHTML = printers.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="printer">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div>
                    <label>Description</label>
                    <input class="catalog-input" value="${item.desc || item.description || ''}" data-field="desc" />
                </div>
                <div>
                    <label>Image URL</label>
                    <input class="catalog-input" value="${item.image || ''}" data-field="image" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="multicolor" ${item.multicolor === true ? 'checked' : ''} />
                    <span>Multicolor (1-5 colors)</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        filamentsList.innerHTML = filaments.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="filament">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        colorsList.innerHTML = colors.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="color">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div>
                    <label>Hex</label>
                    <input class="catalog-input" value="${item.hex || ''}" data-field="hex" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        const hookList = (container, list) => {
            container.querySelectorAll('.catalog-item').forEach(item => {
                item.querySelectorAll('[data-field]').forEach(input => {
                    input.addEventListener('input', () => {
                        const index = parseInt(item.dataset.index, 10);
                        const field = input.dataset.field;
                        const record = list[index];
                        if (!record) return;
                        const value = input.type === 'checkbox' ? input.checked : input.value;
                        if (field === 'active' || field === 'multicolor') {
                            record[field] = value;
                        } else {
                            record[field] = value;
                        }
                    });
                });
                item.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                    const index = parseInt(item.dataset.index, 10);
                    list.splice(index, 1);
                    renderCatalogPrinting();
                });
            });
        };

        hookList(printersList, printers);
        hookList(filamentsList, filaments);
        hookList(colorsList, colors);
    }

    function renderCatalogOtherItems() {
        const list = document.getElementById('catalogOtherItemsList');
        if (!list) return;

        const items = catalogDraft.printing.otherItems || [];
        items.sort(catalogSortByName);

        list.innerHTML = items.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="other-item">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div>
                    <label>Description</label>
                    <input class="catalog-input" value="${item.desc || ''}" data-field="desc" />
                </div>
                <div>
                    <label>Price</label>
                    <input class="catalog-input" value="${item.price || ''}" data-field="price" />
                </div>
                <div>
                    <label>Image URL</label>
                    <input class="catalog-input" value="${item.image || ''}" data-field="image" />
                </div>
                <div>
                    <label>Details</label>
                    <input class="catalog-input" value="${item.details || item.detail || ''}" data-field="details" />
                </div>
                <div>
                    <label>Show Contact Description</label>
                    <input class="catalog-input" value="${item.contactDescription || item.contactText || ''}" data-field="contactDescription" />
                </div>
                <div>
                    <label>Specs (comma)</label>
                    <input class="catalog-input" value="${Array.isArray(item.specs) ? item.specs.join(', ') : ''}" data-field="specs" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="showContact" ${item.showContact === true ? 'checked' : ''} />
                    <span>Show Contact (unchecked = Add to Cart)</span>
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.catalog-item').forEach(row => {
            row.querySelectorAll('[data-field]').forEach(input => {
                input.addEventListener('input', () => {
                    const index = parseInt(row.dataset.index, 10);
                    const field = input.dataset.field;
                    const record = items[index];
                    if (!record) return;
                    const value = input.type === 'checkbox' ? input.checked : input.value;
                    if (field === 'specs') {
                        record.specs = value
                            .split(',')
                            .map(v => v.trim())
                            .filter(Boolean);
                    } else if (field === 'price') {
                        record.price = parseFloat(value) || 0;
                    } else if (field === 'active' || field === 'showContact') {
                        record[field] = value;
                    } else {
                        record[field] = value;
                        if (field === 'desc') {
                            record.description = value;
                        }
                        if (field === 'details') {
                            record.detail = value;
                        }
                        if (field === 'contactDescription') {
                            record.contactText = value;
                        }
                    }
                });
            });
            row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(row.dataset.index, 10);
                items.splice(index, 1);
                renderCatalogOtherItems();
            });
        });
    }

    function renderCatalogUsedShop() {
        const list = document.getElementById('catalogUsedShopList');
        if (!list) return;

        catalogDraft.printing = catalogDraft.printing || {};
        const items = catalogDraft.printing.usedShopItems || [];
        items.sort(catalogSortByName);

        list.innerHTML = items.map((item, index) => `
            <div class="catalog-item" data-index="${index}" data-type="used-shop-item">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${item.id || ''}" data-field="id" readonly />
                </div>
                <div>
                    <label>Name</label>
                    <input class="catalog-input" value="${item.name || ''}" data-field="name" />
                </div>
                <div>
                    <label>Brand</label>
                    <input class="catalog-input" value="${item.brand || ''}" data-field="brand" />
                </div>
                <div>
                    <label>Model</label>
                    <input class="catalog-input" value="${item.model || ''}" data-field="model" />
                </div>
                <div>
                    <label>Price</label>
                    <input class="catalog-input" value="${item.price || ''}" data-field="price" />
                </div>
                <div>
                    <label>Main Image URL</label>
                    <input class="catalog-input" value="${item.image || ''}" data-field="image" />
                </div>
                <div>
                    <label>Preview Description</label>
                    <input class="catalog-input" value="${item.shortDesc || item.desc || ''}" data-field="shortDesc" />
                </div>
                <div>
                    <label>Full Description</label>
                    <input class="catalog-input" value="${item.details || item.description || ''}" data-field="details" />
                </div>
                <div>
                    <label>Gallery Images (comma)</label>
                    <input class="catalog-input" value="${Array.isArray(item.images) ? item.images.join(', ') : ''}" data-field="images" />
                </div>
                <div>
                    <label>Specs (comma)</label>
                    <input class="catalog-input" value="${Array.isArray(item.specs) ? item.specs.join(', ') : ''}" data-field="specs" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div class="inline-actions">
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('.catalog-item').forEach((row) => {
            row.querySelectorAll('[data-field]').forEach((input) => {
                input.addEventListener('input', () => {
                    const index = parseInt(row.dataset.index, 10);
                    const field = input.dataset.field;
                    const record = items[index];
                    if (!record) return;
                    const value = input.type === 'checkbox' ? input.checked : input.value;

                    if (field === 'price') {
                        record.price = parseFloat(value) || 0;
                        return;
                    }
                    if (field === 'images') {
                        record.images = value
                            .split(',')
                            .map(v => v.trim())
                            .filter(Boolean);
                        if (!record.image && record.images.length > 0) {
                            record.image = record.images[0];
                        }
                        return;
                    }
                    if (field === 'specs') {
                        record.specs = value
                            .split(',')
                            .map(v => v.trim())
                            .filter(Boolean);
                        return;
                    }
                    if (field === 'active') {
                        record.active = value;
                        return;
                    }

                    record[field] = value;
                    if (field === 'shortDesc') {
                        record.desc = value;
                    }
                    if (field === 'details') {
                        record.description = value;
                    }
                });
            });

            row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                const index = parseInt(row.dataset.index, 10);
                items.splice(index, 1);
                renderCatalogUsedShop();
            });
        });
    }

    function renderCatalogNews() {
        const list = document.getElementById('catalogNewsList');
        const sortModeInput = document.getElementById('catalogNewsSortMode');
        if (!list) return;

        catalogDraft.news = normalizeNewsItems(catalogDraft.news);
        if (typeof catalogDraft.newsSortMode !== 'string') {
            catalogDraft.newsSortMode = newsSortMode;
        }
        const draftSortMode = String(catalogDraft.newsSortMode || 'manual').toLowerCase() === 'newest' ? 'newest' : 'manual';
        if (sortModeInput) {
            sortModeInput.value = draftSortMode;
            sortModeInput.onchange = () => {
                catalogDraft.newsSortMode = sortModeInput.value === 'newest' ? 'newest' : 'manual';
                updateCatalogNewsDirtyIndicator();
            };
        }

        const items = catalogDraft.news;
        const now = Date.now();
        const titleCount = new Map();
        const idCount = new Map();
        items.sort((a, b) => {
            const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
            if (orderDiff !== 0) return orderDiff;
            const timeA = Number.isFinite(new Date(a.publishedAt || '').getTime()) ? new Date(a.publishedAt).getTime() : 0;
            const timeB = Number.isFinite(new Date(b.publishedAt || '').getTime()) ? new Date(b.publishedAt).getTime() : 0;
            return timeB - timeA;
        });
        items.forEach((item, index) => {
            item.sortOrder = index;
            const titleKey = String(item.title || '').trim().toLowerCase();
            const idKey = String(item.id || '').trim().toLowerCase();
            if (titleKey) {
                titleCount.set(titleKey, (titleCount.get(titleKey) || 0) + 1);
            }
            if (idKey) {
                idCount.set(idKey, (idCount.get(idKey) || 0) + 1);
            }
        });
        updateCatalogNewsDirtyIndicator();

        list.innerHTML = items.map((item, index) => {
            const titleKey = String(item.title || '').trim().toLowerCase();
            const idKey = String(item.id || '').trim().toLowerCase();
            const hasDuplicateTitle = titleKey ? (titleCount.get(titleKey) || 0) > 1 : false;
            const hasDuplicateId = idKey ? (idCount.get(idKey) || 0) > 1 : false;
            const summaryMeta = getNewsSummaryMetrics(item);
            return `
            <div class="catalog-item" data-index="${index}" data-type="news-item">
                <div>
                    <label>ID</label>
                    <input class="catalog-input" value="${escapeHtml(item.id || '')}" data-field="id" readonly />
                    ${hasDuplicateId ? '<p class="catalog-news-warning">Duplicate ID detected</p>' : ''}
                </div>
                <div>
                    <label>Title</label>
                    <input class="catalog-input" value="${escapeHtml(item.title || '')}" data-field="title" />
                    ${hasDuplicateTitle ? '<p class="catalog-news-warning">Duplicate title detected</p>' : ''}
                    ${item.active === false
                        ? '<p class="catalog-news-state is-inactive">Inactive</p>'
                        : (isNewsPublished(item, now)
                            ? '<p class="catalog-news-state is-published">Published</p>'
                            : '<p class="catalog-news-state is-scheduled">Scheduled</p>')}
                </div>
                <div>
                    <label>Image URL</label>
                    <input class="catalog-input" value="${escapeHtml(item.image || '')}" data-field="image" />
                </div>
                <div>
                    <label>Published At</label>
                    <input type="datetime-local" class="catalog-input" value="${escapeHtml(toDateTimeLocalInputValue(item.publishedAt))}" data-field="publishedAt" />
                </div>
                <div>
                    <label>Order</label>
                    <input type="number" min="0" step="1" class="catalog-input" value="${Number.isFinite(Number(item.sortOrder)) ? Math.max(0, Math.floor(Number(item.sortOrder))) : index}" data-field="sortOrder" />
                </div>
                <div class="toggle">
                    <input type="checkbox" data-field="active" ${item.active === false ? '' : 'checked'} />
                    <span>Active</span>
                </div>
                <div style="grid-column: 1 / -1;">
                    <label>Small Text</label>
                    <div class="catalog-rich-toolbar" data-toolbar="summary">
                        <button type="button" class="catalog-rich-btn" data-action="generate-summary">Generate</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="bold">Bold</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="italic">Italic</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="underline">Underline</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="strikeThrough">Strike</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="insertUnorderedList">List</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="removeFormat">Clear</button>
                    </div>
                    <div class="catalog-rich-editor" contenteditable="true" data-field="summary">${item.summary || ''}</div>
                </div>
                <div style="grid-column: 1 / -1;">
                    <label>Big Text</label>
                    <div class="catalog-rich-toolbar" data-toolbar="content">
                        <button type="button" class="catalog-rich-btn" data-cmd="bold">Bold</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="italic">Italic</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="underline">Underline</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="strikeThrough">Strike</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="insertUnorderedList">List</button>
                        <button type="button" class="catalog-rich-btn" data-cmd="removeFormat">Clear</button>
                    </div>
                    <div class="catalog-rich-editor" contenteditable="true" data-field="content">${item.content || ''}</div>
                </div>
                <div class="catalog-news-preview-wrap" style="grid-column: 1 / -1;">
                    <label>Preview</label>
                    <article class="catalog-news-preview ${item.image ? '' : 'no-image'}" data-role="news-preview">
                        ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="catalog-news-preview-image" width="1200" height="675" loading="lazy" decoding="async" fetchpriority="low">` : ''}
                        <div class="catalog-news-preview-body">
                            ${item.publishedAt ? `<p class="catalog-news-preview-date">${escapeHtml(formatNewsDateLabel(item.publishedAt))}</p>` : ''}
                            <h4 class="catalog-news-preview-title">${escapeHtml(item.title || '')}</h4>
                            <div class="catalog-news-preview-summary">${summaryMeta.summaryHtml}</div>
                            <p class="catalog-news-preview-meta">Summary chars: ${summaryMeta.summaryChars}${summaryMeta.isFallback ? ' (fallback)' : ''}</p>
                        </div>
                    </article>
                </div>
                <div class="inline-actions" style="grid-column: 1 / -1; justify-content: flex-end;">
                    <button class="btn btn-sm btn-secondary" data-action="open-home" ${item.active === false || !isNewsPublished(item, now) ? 'disabled' : ''}>Open on Homepage</button>
                    <button class="btn btn-sm btn-secondary" data-action="publish-now" ${isNewsPublished(item, now) ? 'disabled' : ''}>Publish Now</button>
                    <button class="btn btn-sm btn-secondary" data-action="move-up" ${index === 0 ? 'disabled' : ''}>Up</button>
                    <button class="btn btn-sm btn-secondary" data-action="move-down" ${index === items.length - 1 ? 'disabled' : ''}>Down</button>
                    <button class="btn btn-sm btn-secondary" data-action="delete">Delete</button>
                </div>
            </div>
        `;
        }).join('');

        list.querySelectorAll('.catalog-item').forEach((row) => {
            const index = parseInt(row.dataset.index, 10);
            const record = items[index];
            if (!record) return;

            const previewEl = row.querySelector('[data-role="news-preview"]');
            const summaryEditor = row.querySelector('.catalog-rich-editor[data-field="summary"]');
            const refreshPreview = () => {
                if (!previewEl) return;
                const summaryMeta = getNewsSummaryMetrics(record);
                previewEl.classList.toggle('no-image', !record.image);
                previewEl.innerHTML = `
                    ${record.image ? `<img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title || '')}" class="catalog-news-preview-image" width="1200" height="675" loading="lazy" decoding="async" fetchpriority="low">` : ''}
                    <div class="catalog-news-preview-body">
                        ${record.publishedAt ? `<p class="catalog-news-preview-date">${escapeHtml(formatNewsDateLabel(record.publishedAt))}</p>` : ''}
                        <h4 class="catalog-news-preview-title">${escapeHtml(record.title || '')}</h4>
                        <div class="catalog-news-preview-summary">${summaryMeta.summaryHtml}</div>
                        <p class="catalog-news-preview-meta">Summary chars: ${summaryMeta.summaryChars}${summaryMeta.isFallback ? ' (fallback)' : ''}</p>
                    </div>
                `;
            };

            row.querySelectorAll('input[data-field]').forEach((input) => {
                input.addEventListener('input', () => {
                    const field = input.dataset.field;
                    const value = input.type === 'checkbox' ? input.checked : input.value;
                    if (field === 'active') {
                        record.active = Boolean(value);
                    } else if (field === 'title' || field === 'image') {
                        record[field] = String(value || '').trim();
                    } else if (field === 'publishedAt') {
                        record.publishedAt = fromDateTimeLocalInputValue(value);
                    } else if (field === 'sortOrder') {
                        record.sortOrder = Math.max(0, Math.floor(Number(value) || 0));
                    }
                    refreshPreview();
                    updateCatalogNewsDirtyIndicator();
                });
            });

            row.querySelectorAll('.catalog-rich-editor').forEach((editor) => {
                editor.addEventListener('input', () => {
                    const field = editor.dataset.field;
                    if (field !== 'summary' && field !== 'content') return;
                    record[field] = sanitizeNewsHtml(editor.innerHTML);
                    refreshPreview();
                    updateCatalogNewsDirtyIndicator();
                });
            });

            row.querySelectorAll('.catalog-rich-toolbar .catalog-rich-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    const cmd = btn.getAttribute('data-cmd');
                    const toolbar = btn.closest('.catalog-rich-toolbar');
                    const editor = toolbar?.nextElementSibling;
                    if (!editor) return;
                    editor.focus();
                    document.execCommand(cmd, false, null);
                    const field = editor.dataset.field;
                    if (field === 'summary' || field === 'content') {
                        record[field] = sanitizeNewsHtml(editor.innerHTML);
                        refreshPreview();
                        updateCatalogNewsDirtyIndicator();
                    }
                });
            });

            row.querySelector('[data-action="generate-summary"]')?.addEventListener('click', () => {
                record.summary = buildNewsSummaryFallback(record.content);
                if (summaryEditor) {
                    summaryEditor.innerHTML = record.summary;
                }
                refreshPreview();
                updateCatalogNewsDirtyIndicator();
            });

            row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
                items.splice(index, 1);
                items.forEach((item, itemIndex) => {
                    item.sortOrder = itemIndex;
                });
                renderCatalogNews();
            });

            row.querySelector('[data-action="publish-now"]')?.addEventListener('click', () => {
                record.publishedAt = new Date().toISOString();
                if (record.active === false) {
                    record.active = true;
                }
                renderCatalogNews();
            });

            row.querySelector('[data-action="open-home"]')?.addEventListener('click', () => {
                if (record.active === false || !isNewsPublished(record)) return;
                showPage('home');
                openNewsDetailsModal(record.id);
            });

            row.querySelector('[data-action="move-up"]')?.addEventListener('click', () => {
                if (index <= 0) return;
                const temp = items[index - 1];
                items[index - 1] = items[index];
                items[index] = temp;
                items.forEach((item, itemIndex) => {
                    item.sortOrder = itemIndex;
                });
                renderCatalogNews();
            });

            row.querySelector('[data-action="move-down"]')?.addEventListener('click', () => {
                if (index >= items.length - 1) return;
                const temp = items[index + 1];
                items[index + 1] = items[index];
                items[index] = temp;
                items.forEach((item, itemIndex) => {
                    item.sortOrder = itemIndex;
                });
                renderCatalogNews();
            });
        });
    }

    /**
     * Storage module - Now uses API calls instead of localStorage
     */
    const Storage = {
        cart: [],
        orders: [],
        user: null,
        adminLoggedIn: false,

        setUser(user) {
            this.user = user;
        },
        getUser() {
            return this.user;
        },
        setAdminLoggedIn(value) {
            this.adminLoggedIn = value;
        },
        getToken() {
            return localStorage.getItem('token');
        },
        setToken(token) {
            if (token) {
                localStorage.setItem('token', token);
            } else {
                localStorage.removeItem('token');
            }
        },

        async loadCart() {
            // If not authenticated, load cart from localStorage
            if (!this.getToken()) {
                try {
                    const raw = localStorage.getItem('localCart');
                    this.cart = raw ? JSON.parse(raw) : [];
                    return this.cart;
                } catch (err) {
                    console.error('Error loading local cart:', err);
                    this.cart = [];
                    return [];
                }
            }

            try {
                const result = await apiCall('GET', '/cart');
                this.cart = result.cart || result.cartItems || [];
                return this.cart;
            } catch (error) {
                console.error('Error loading cart:', error);
                this.cart = [];
                return [];
            }
        },
        async saveCart() {
            // If not authenticated, persist cart to localStorage
            if (!this.getToken()) {
                try {
                    localStorage.setItem('localCart', JSON.stringify(this.cart || []));
                } catch (err) {
                    console.error('Error saving local cart:', err);
                }
                return;
            }

            // When authenticated, cart is handled by API; no-op here
        },

        async loadOrders() {
            try {
                const result = await apiCall('GET', '/orders');
                this.orders = result.orders || [];
                return this.orders;
            } catch (error) {
                console.error('Error loading orders:', error);
                this.orders = [];
                return [];
            }
        },
        async saveOrders() {
            // Orders are auto-saved via API
        },
        reloadOrders() {
            return this.loadOrders();
        }
    };

    const ROLE_DEFAULT_PERMISSIONS = {
        customer: [],
        worker: ['orders', 'chats'],
        manager: ['orders', 'catalog', 'chats'],
        owner: ['orders', 'catalog', 'chats', 'credentials']
    };

    function normalizePermissions(userOrRole, permissions = null) {
        const role = typeof userOrRole === 'object'
            ? String(userOrRole?.role || '').toLowerCase()
            : String(userOrRole || '').toLowerCase();

        const source = permissions || (typeof userOrRole === 'object' ? userOrRole?.permissions : null);
        const normalized = Array.isArray(source)
            ? source.map(p => String(p || '').trim().toLowerCase()).filter(Boolean)
            : [];

        if (normalized.length > 0) {
            return [...new Set(normalized)];
        }

        return ROLE_DEFAULT_PERMISSIONS[role] ? [...ROLE_DEFAULT_PERMISSIONS[role]] : [];
    }

    function hasPermission(userOrRole, permission, permissions = null) {
        const role = typeof userOrRole === 'object'
            ? String(userOrRole?.role || '').toLowerCase()
            : String(userOrRole || '').toLowerCase();
        if (role === 'owner') return true;
        return normalizePermissions(userOrRole, permissions).includes(String(permission || '').toLowerCase());
    }

    const canAccessAdmin = (userOrRole, permissions = null) => {
        const role = typeof userOrRole === 'object'
            ? String(userOrRole?.role || '').toLowerCase()
            : String(userOrRole || '').toLowerCase();
        if (role === 'owner') return true;
        if (role !== 'worker' && role !== 'manager') return false;
        return normalizePermissions(userOrRole, permissions).length > 0;
    };

    const canManageCatalog = (userOrRole, permissions = null) => hasPermission(userOrRole, 'catalog', permissions);
    const canManageOrders = (userOrRole, permissions = null) => hasPermission(userOrRole, 'orders', permissions);
    const canAccessChats = (userOrRole, permissions = null) => hasPermission(userOrRole, 'chats', permissions);
    const canAccessCredentials = (userOrRole, permissions = null) => hasPermission(userOrRole, 'credentials', permissions);
    const isOwnerRole = (role) => role === 'owner';

    function canAccessAdminTab(tabName, user) {
        if (!user) return false;
        if (tabName === 'credentials') return canAccessCredentials(user);
        if (tabName === 'catalog') return canManageCatalog(user);
        if (tabName === 'chats') return canAccessChats(user);
        if (['repairs', 'custom-pc', 'printing', 'other-items', 'used-shop'].includes(tabName)) return canManageOrders(user);
        return false;
    }

    // ========================================================================
    // MODULE 3: SERVICE DATA & CONFIGURATION
    // Comprehensive data for all repair services by device type
    // ========================================================================
    let serviceData = {
        phone: {
            name: 'Phone',
            icon: 'pink',
            brands: [
                { id: 'apple', name: 'Apple' },
                { id: 'samsung', name: 'Samsung' },
                { id: 'google', name: 'Google' },
                { id: 'oneplus', name: 'OnePlus' },
                { id: 'xiaomi', name: 'Xiaomi' },
                { id: 'huawei', name: 'Huawei' },
                { id: 'motorola', name: 'Motorola' },
                { id: 'sony', name: 'Sony' },
                { id: 'other', name: 'Other' }
            ],
            models: {
                apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone SE', 'Other iPhone'],
                samsung: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23', 'Galaxy Z Fold 5', 'Galaxy Z Flip 5', 'Galaxy A54', 'Galaxy A34', 'Other Samsung'],
                google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel 6 Pro', 'Pixel 6', 'Other Pixel'],
                oneplus: ['OnePlus 12', 'OnePlus 11', 'OnePlus 10 Pro', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'Other OnePlus'],
                xiaomi: ['Xiaomi 14', 'Xiaomi 13', 'Xiaomi 12', 'Redmi Note 13', 'Redmi Note 12', 'POCO F5', 'Other Xiaomi'],
                huawei: ['P60 Pro', 'P50 Pro', 'Mate 50', 'Nova 11', 'Other Huawei'],
                motorola: ['Edge 40 Pro', 'Edge 40', 'Razr 40', 'Moto G84', 'Other Motorola'],
                sony: ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V', 'Other Sony'],
                other: ['Other Phone Model']
            },
            repairs: [
                { id: 'screen', name: 'Screen Repair', desc: 'Cracked or damaged display', price: 89, icon: 'screen' },
                { id: 'battery', name: 'Battery Replacement', desc: 'Poor battery life or swelling', price: 49, icon: 'battery' },
                { id: 'camera', name: 'Camera Repair', desc: 'Front or back camera issues', price: 69, icon: 'camera' },
                { id: 'speaker', name: 'Speaker/Audio', desc: 'Sound or microphone problems', price: 59, icon: 'speaker' },
                { id: 'charging', name: 'Charging Port', desc: 'Won\'t charge or loose connection', price: 45, icon: 'charging' },
                { id: 'water', name: 'Water Damage', desc: 'Liquid damage recovery', price: 99, icon: 'water' },
                { id: 'storage', name: 'Storage/Data', desc: 'Data recovery or upgrade', price: 79, icon: 'storage' },
                { id: 'wifi', name: 'WiFi/Bluetooth', desc: 'Connectivity issues', price: 55, icon: 'wifi' },
                { id: 'motherboard', name: 'Motherboard', desc: 'Internal component failure', price: 149, icon: 'motherboard' },
                { id: 'other', name: 'Other Issue', desc: 'Something else', price: 39, icon: 'other' }
            ]
        },
        tablet: {
            name: 'Tablet',
            icon: 'orange',
            brands: [
                { id: 'apple', name: 'Apple iPad' },
                { id: 'samsung', name: 'Samsung' },
                { id: 'lenovo', name: 'Lenovo' },
                { id: 'microsoft', name: 'Microsoft' },
                { id: 'huawei', name: 'Huawei' },
                { id: 'amazon', name: 'Amazon' },
                { id: 'other', name: 'Other' }
            ],
            models: {
                apple: ['iPad Pro 12.9"', 'iPad Pro 11"', 'iPad Air', 'iPad 10th Gen', 'iPad 9th Gen', 'iPad mini', 'Other iPad'],
                samsung: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S8', 'Galaxy Tab A8', 'Other Samsung Tablet'],
                lenovo: ['Tab P12 Pro', 'Tab P11 Pro', 'Tab M10', 'Other Lenovo Tablet'],
                microsoft: ['Surface Pro 9', 'Surface Pro 8', 'Surface Go 3', 'Other Surface'],
                huawei: ['MatePad Pro', 'MatePad 11', 'Other Huawei Tablet'],
                amazon: ['Fire HD 10', 'Fire HD 8', 'Fire 7', 'Other Fire Tablet'],
                other: ['Other Tablet Model']
            },
            repairs: [
                { id: 'screen', name: 'Screen Repair', desc: 'Cracked or damaged display', price: 99, icon: 'screen' },
                { id: 'battery', name: 'Battery Replacement', desc: 'Poor battery life or swelling', price: 69, icon: 'battery' },
                { id: 'camera', name: 'Camera Repair', desc: 'Front or back camera issues', price: 79, icon: 'camera' },
                { id: 'speaker', name: 'Speaker/Audio', desc: 'Sound or microphone problems', price: 65, icon: 'speaker' },
                { id: 'charging', name: 'Charging Port', desc: 'Won\'t charge or loose connection', price: 55, icon: 'charging' },
                { id: 'water', name: 'Water Damage', desc: 'Liquid damage recovery', price: 119, icon: 'water' },
                { id: 'storage', name: 'Storage/Data', desc: 'Data recovery or upgrade', price: 89, icon: 'storage' },
                { id: 'motherboard', name: 'Motherboard', desc: 'Internal component failure', price: 169, icon: 'motherboard' },
                { id: 'other', name: 'Other Issue', desc: 'Something else', price: 49, icon: 'other' }
            ]
        },
        notebook: {
            name: 'Notebook',
            icon: 'red',
            brands: [
                { id: 'apple', name: 'Apple MacBook' },
                { id: 'dell', name: 'Dell' },
                { id: 'hp', name: 'HP' },
                { id: 'lenovo', name: 'Lenovo' },
                { id: 'asus', name: 'Asus' },
                { id: 'acer', name: 'Acer' },
                { id: 'msi', name: 'MSI' },
                { id: 'microsoft', name: 'Microsoft' },
                { id: 'other', name: 'Other' }
            ],
            models: {
                apple: ['MacBook Pro 16"', 'MacBook Pro 14"', 'MacBook Pro 13"', 'MacBook Air 15"', 'MacBook Air 13"', 'Other MacBook'],
                dell: ['XPS 15', 'XPS 13', 'Inspiron 16', 'Inspiron 15', 'Latitude', 'Alienware', 'Other Dell'],
                hp: ['Spectre x360', 'Envy', 'Pavilion', 'EliteBook', 'ProBook', 'Omen', 'Other HP'],
                lenovo: ['ThinkPad X1 Carbon', 'ThinkPad T Series', 'IdeaPad', 'Yoga', 'Legion', 'Other Lenovo'],
                asus: ['ZenBook', 'VivoBook', 'ROG Zephyrus', 'ROG Strix', 'TUF Gaming', 'Other Asus'],
                acer: ['Swift', 'Aspire', 'Nitro', 'Predator', 'Other Acer'],
                msi: ['Stealth', 'Raider', 'Creator', 'Prestige', 'Other MSI'],
                microsoft: ['Surface Laptop 5', 'Surface Laptop 4', 'Surface Book', 'Other Surface Laptop'],
                other: ['Other Laptop Model']
            },
            repairs: [
                { id: 'screen', name: 'Screen Repair', desc: 'Cracked or damaged display', price: 129, icon: 'screen' },
                { id: 'battery', name: 'Battery Replacement', desc: 'Poor battery life or swelling', price: 89, icon: 'battery' },
                { id: 'keyboard', name: 'Keyboard/Trackpad', desc: 'Keys or trackpad not working', price: 79, icon: 'keyboard' },
                { id: 'charging', name: 'Charging Port', desc: 'Won\'t charge or adapter issues', price: 69, icon: 'charging' },
                { id: 'storage', name: 'Storage/Data', desc: 'SSD upgrade or data recovery', price: 79, icon: 'storage' },
                { id: 'speaker', name: 'Speaker/Audio', desc: 'Sound or microphone problems', price: 65, icon: 'speaker' },
                { id: 'wifi', name: 'WiFi/Bluetooth', desc: 'Connectivity issues', price: 55, icon: 'wifi' },
                { id: 'fan', name: 'Fan/Overheating', desc: 'Loud fan or thermal issues', price: 69, icon: 'fan' },
                { id: 'motherboard', name: 'Motherboard', desc: 'Internal component failure', price: 199, icon: 'motherboard' },
                { id: 'other', name: 'Other Issue', desc: 'Something else', price: 59, icon: 'other' }
            ]
        },
        pc: {
            name: 'Desktop PC',
            icon: 'green',
            brands: [
                { id: 'custom', name: 'Custom Build' },
                { id: 'dell', name: 'Dell' },
                { id: 'hp', name: 'HP' },
                { id: 'lenovo', name: 'Lenovo' },
                { id: 'asus', name: 'Asus' },
                { id: 'acer', name: 'Acer' },
                { id: 'apple', name: 'Apple iMac' },
                { id: 'other', name: 'Other' }
            ],
            models: {
                custom: ['Gaming PC', 'Workstation', 'Home/Office PC', 'Server', 'Other Custom'],
                dell: ['OptiPlex', 'Inspiron Desktop', 'XPS Desktop', 'Alienware Aurora', 'Precision', 'Other Dell Desktop'],
                hp: ['Pavilion Desktop', 'ENVY Desktop', 'Omen', 'EliteDesk', 'ProDesk', 'Other HP Desktop'],
                lenovo: ['ThinkCentre', 'IdeaCentre', 'Legion Tower', 'Other Lenovo Desktop'],
                asus: ['ROG Strix', 'TUF Gaming', 'ProArt', 'ExpertCenter', 'Other Asus Desktop'],
                acer: ['Aspire', 'Nitro', 'Predator Orion', 'Other Acer Desktop'],
                apple: ['iMac 24"', 'iMac 27"', 'Mac Mini', 'Mac Studio', 'Mac Pro', 'Other Mac'],
                other: ['Other Desktop Model']
            },
            repairs: [
                { id: 'nopower', name: 'Won\'t Turn On', desc: 'No power or boot issues', price: 69, icon: 'power' },
                { id: 'slow', name: 'Running Slow', desc: 'Performance optimization', price: 59, icon: 'slow' },
                { id: 'virus', name: 'Virus Removal', desc: 'Malware and virus cleanup', price: 79, icon: 'virus' },
                { id: 'storage', name: 'Storage/Data', desc: 'HDD/SSD upgrade or recovery', price: 79, icon: 'storage' },
                { id: 'ram', name: 'RAM Upgrade', desc: 'Memory upgrade', price: 49, icon: 'ram' },
                { id: 'gpu', name: 'Graphics Card', desc: 'GPU repair or upgrade', price: 89, icon: 'gpu' },
                { id: 'psu', name: 'Power Supply', desc: 'PSU replacement', price: 79, icon: 'psu' },
                { id: 'cooling', name: 'Cooling/Fans', desc: 'Thermal issues', price: 59, icon: 'fan' },
                { id: 'motherboard', name: 'Motherboard', desc: 'Internal component failure', price: 149, icon: 'motherboard' },
                { id: 'os', name: 'OS Install', desc: 'Windows reinstallation', price: 69, icon: 'os' },
                { id: 'other', name: 'Other Issue', desc: 'Something else', price: 49, icon: 'other' }
            ]
        },
        printer: {
            name: '3D Printer',
            icon: 'purple',
            brands: [
                { id: 'creality', name: 'Creality' },
                { id: 'prusa', name: 'Prusa' },
                { id: 'anycubic', name: 'Anycubic' },
                { id: 'elegoo', name: 'Elegoo' },
                { id: 'formlabs', name: 'Formlabs' },
                { id: 'flashforge', name: 'FlashForge' },
                { id: 'stratasys', name: 'Stratasys' },
                { id: 'other', name: 'Other' }
            ],
            models: {
                creality: ['Ender 3', 'Ender 3 Pro', 'Ender 3 V2', 'Ender 5', 'Ender 5 Pro', 'Ender 7', 'Ender X1', 'CR-10', 'CR-10S Pro', 'Other Creality'],
                prusa: ['Prusa i3 MK3S+', 'Prusa i3 MK3.5', 'Prusa XL', 'Prusa Mini+', 'Other Prusa'],
                anycubic: ['Photon Mono', 'Photon S', 'i3 Mega', 'i3 Mega-S', 'Vyper', 'Other Anycubic'],
                elegoo: ['Mars 3', 'Mars 3 Pro', 'Neptune 2', 'Neptune 3', 'Neptune 4', 'Other Elegoo'],
                formlabs: ['Form 3', 'Form 3B', 'Form 4', 'Other Formlabs'],
                flashforge: ['Finder', 'Hunter', 'Creator Pro', 'Other FlashForge'],
                stratasys: ['uPrint SE Plus', 'F170', 'J26', 'Other Stratasys'],
                other: ['Other 3D Printer Model']
            },
            repairs: [
                { id: 'extruder', name: 'Extruder Repair', desc: 'Clogged or broken extruder', price: 79, icon: 'extruder' },
                { id: 'nozzle', name: 'Nozzle Replacement', desc: 'Worn or damaged nozzle', price: 35, icon: 'nozzle' },
                { id: 'heatbed', name: 'Heat Bed Repair', desc: 'Bed not heating or damaged', price: 89, icon: 'heatbed' },
                { id: 'leveling', name: 'Bed Leveling', desc: 'Calibration and leveling service', price: 45, icon: 'leveling' },
                { id: 'motor', name: 'Motor Repair', desc: 'Stepper motor issues', price: 69, icon: 'motor' },
                { id: 'firmware', name: 'Firmware Update', desc: 'Software/firmware installation', price: 39, icon: 'firmware' },
                { id: 'display', name: 'Display/Screen', desc: 'Touchscreen or LCD repair', price: 59, icon: 'display' },
                { id: 'hotend', name: 'Hot End Replacement', desc: 'New hot end assembly', price: 85, icon: 'hotend' },
                { id: 'frame', name: 'Frame Repair', desc: 'Structural damage repair', price: 99, icon: 'frame' },
                { id: 'other', name: 'Other Issue', desc: 'Something else', price: 49, icon: 'other' }
            ]
        }
    };

    // ========================================================================
    // MODULE 4: SVG ICONS
    // All repair and device icons in one place for easy maintenance
    // ========================================================================
    const repairIcons = {
        screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>',
        battery: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>',
        camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="4"/><path d="M5 7h2l2-2h6l2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/></svg>',
        speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
        charging: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"/><line x1="23" y1="13" x2="23" y2="11"/><polyline points="11 6 7 12 13 12 9 18"/></svg>',
        water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
        storage: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
        keyboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M8 12h.001M12 12h.001M16 12h.001M6 16h12"/></svg>',
        wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
        motherboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>',
        fan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
        power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
        slow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        virus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
        ram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="18" x2="6" y2="21"/><line x1="18" y1="18" x2="18" y2="21"/></svg>',
        gpu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><line x1="14" y1="10" x2="18" y2="10"/><line x1="14" y1="14" x2="18" y2="14"/></svg>',
        psu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        os: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        other: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        extruder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 8v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V8"/><circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="8"/></svg>',
        nozzle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v6M12 16v6M8 8h8M8 16h8M10 8v8M14 8v8"/></svg>',
        heatbed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 8h8M8 12h8M8 16h8"/></svg>',
        leveling: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M12 3v18M7 7l10 10M17 7l-10 10"/></svg>',
        motor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 2v20M2 12h20M7 7l10 10M17 7l-10 10"/></svg>',
        firmware: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/></svg>',
        display: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="7" y1="7" x2="17" y2="7"/><line x1="7" y1="11" x2="17" y2="11"/></svg>',
        hotend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2c-5 0-9 3-9 9v6c0 2 1 4 3 5v2h12v-2c2-1 3-3 3-5v-6c0-6-4-9-9-9Z"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
        frame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>'
    };

    const deviceIconSvg = {
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        tablet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>',
        notebook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"></path><path d="M2 19h20"></path></svg>',
        pc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
        printer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9h12M6 14h12M8 19h8M9 5a3 3 0 0 1 3-3h0a3 3 0 0 1 3 3M9 5h6v4H9M4 9v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/></svg>'
    };

    const customBuildIcons = {
        custom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7h7l-5.5 4 2.5 7-7-4-7 4 2.5-7L2 9h7z"/></svg>',
        server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><circle cx="7" cy="7" r="1"/><circle cx="7" cy="18" r="1"/></svg>',
        raspberry: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h10v10H7z"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15" r="1"/></svg>',
        nvidia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12c4-6 14-6 18 0-4 6-14 6-18 0z"/><circle cx="12" cy="12" r="3"/></svg>',
        case: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="3" width="12" height="18" rx="2"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="12" x2="15" y2="12"/></svg>',
        rack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="3" width="16" height="6" rx="1"/><rect x="4" y="10" width="16" height="6" rx="1"/><rect x="4" y="17" width="16" height="4" rx="1"/></svg>'
    };

    // ========================================================================
    // MODULE 5: CUSTOM PC PARTS DATA
    // Components available for the custom PC builder
    // ========================================================================
    let customPCParts = {
        buildType: [
            { id: 'custom', name: 'Custom PC' },
            { id: 'server', name: 'Server' }
        ],
        serverType: [
            { id: 'server-standard', name: 'Server' },
            { id: 'server-home-assistant', name: 'Home Assistant Server' }
        ],
        buildStatus: [
            { id: 'built', name: 'Already Built' },
            { id: 'need-build', name: 'Need Build' }
        ],
        osOption: [
            { id: 'os-installed', name: 'Install with OS' },
            { id: 'os-clean', name: 'Clean (No OS)' }
        ],
        osOptionDescription: 'Choose whether you want the system delivered with an operating system.',
        installOption: [
            { id: 'install-yes', name: 'Installation (We will install the server)' },
            { id: 'install-no', name: 'No Installation' }
        ],
        rack: [
            { id: 'rack-6u', name: '6U Small Rack', price: 199 },
            { id: 'rack-12u', name: '12U Small Rack', price: 349 },
            { id: 'rack-24u', name: '24U Small Rack', price: 599 }
        ],
        haBrand: [
            { id: 'raspberry', name: 'Raspberry Pi' },
            { id: 'nvidia', name: 'Nvidia Jetson' }
        ],
        haType: [
            { id: 'case', name: 'Case' },
            { id: 'rack', name: 'Small Rack' }
        ],
        haModelRaspberry: [
            { id: 'pi-3', name: 'Raspberry Pi 3', price: 59 },
            { id: 'pi-4', name: 'Raspberry Pi 4', price: 109 },
            { id: 'pi-5', name: 'Raspberry Pi 5', price: 149 }
        ],
        haModelNvidia: [
            { id: 'jetson-nano', name: 'Jetson Nano', price: 149 },
            { id: 'jetson-xavier-nx', name: 'Jetson Xavier NX', price: 399 },
            { id: 'jetson-orin-nano', name: 'Jetson Orin Nano', price: 499 },
            { id: 'jetson-orin-nx', name: 'Jetson Orin NX', price: 899 },
            { id: 'jetson-agx-orin', name: 'Jetson AGX Orin', price: 1799 }
        ],
        haRamRaspberry: [
            { id: 'ram-8', name: '8GB RAM', price: 40 },
            { id: 'ram-16', name: '16GB RAM', price: 80 },
            { id: 'ram-32', name: '32GB RAM', price: 160 },
            { id: 'ram-64', name: '64GB RAM', price: 320 }
        ],
        haRamNvidia: [
            { id: 'ram-8', name: '8GB RAM', price: 60 },
            { id: 'ram-16', name: '16GB RAM', price: 120 },
            { id: 'ram-32', name: '32GB RAM', price: 240 },
            { id: 'ram-64', name: '64GB RAM', price: 480 }
        ],
        haStorageTypeRaspberry: [
            { id: 'sd-card', name: 'SD Card' },
            { id: 'm2-ssd', name: 'M.2 SSD' }
        ],
        haStorageTypeNvidia: [
            { id: 'm2-ssd', name: 'M.2 SSD' }
        ],
        haStorageSizeSd: [
            { id: 'sd-32', name: '32GB SD', price: 12 },
            { id: 'sd-64', name: '64GB SD', price: 18 }
        ],
        haStorageSizeSsd: [
            { id: 'ssd-512', name: '512GB SSD', price: 79 },
            { id: 'ssd-1t', name: '1TB SSD', price: 129 },
            { id: 'ssd-2t', name: '2TB SSD', price: 219 }
        ],
        haCase: [
            { id: 'case-compact', name: 'Compact Case', price: 39 },
            { id: 'case-aluminum', name: 'Aluminum Case', price: 79 },
            { id: 'case-fan', name: 'Active Cooling Case', price: 99 }
        ],
        haSwitch: [
            { id: 'switch-none', name: 'No Switch', price: 0 },
            { id: 'switch-5', name: '5-Port Switch', price: 29 },
            { id: 'switch-8', name: '8-Port Switch', price: 49 },
            { id: 'switch-16', name: '16-Port Switch', price: 89 }
        ],
        haInstallOs: [
            { id: 'haos', name: 'Home Assistant OS' },
            { id: 'debian', name: 'Debian' },
            { id: 'clean', name: 'Clean Install' }
        ],
        haCluster: [
            { id: 'cluster-single', name: 'Single Node' },
            { id: 'cluster-2', name: '2-Node Cluster' },
            { id: 'cluster-4', name: '4-Node Cluster' },
            { id: 'cluster-8', name: '8-Node Cluster' }
        ],
        cpuBrand: [
            { id: 'intel', name: 'Intel' },
            { id: 'amd', name: 'AMD' }
        ],
        intel: [
            {
                id: 'cpu-intel-i5-13600k',
                name: 'Intel Core i5-13600K',
                price: 289,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '14 cores (6P + 8E)',
                    '20 threads',
                    'Max turbo 5.1 GHz',
                    '125W base power',
                    'Intel UHD 770 graphics'
                ]
            },
            {
                id: 'cpu-intel-i7-13700k',
                name: 'Intel Core i7-13700K',
                price: 409,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '16 cores (8P + 8E)',
                    '24 threads',
                    'Max turbo 5.4 GHz',
                    '125W base power',
                    'Intel UHD 770 graphics'
                ]
            },
            {
                id: 'cpu-intel-i9-13900k',
                name: 'Intel Core i9-13900K',
                price: 589,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '24 cores (8P + 16E)',
                    '32 threads',
                    'Max turbo 5.8 GHz',
                    '125W base power',
                    'Intel UHD 770 graphics'
                ]
            }
        ],
        amd: [
            {
                id: 'cpu-amd-5600x',
                name: 'AMD Ryzen 5 5600X',
                price: 199,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '6 cores / 12 threads',
                    'Max boost 4.6 GHz',
                    '65W TDP',
                    'Unlocked multiplier',
                    'PCIe 4.0 support'
                ]
            },
            {
                id: 'cpu-amd-7600x',
                name: 'AMD Ryzen 5 7600X',
                price: 229,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '6 cores / 12 threads',
                    'Max boost 5.3 GHz',
                    '105W TDP',
                    'AM5 socket',
                    'DDR5 support'
                ]
            },
            {
                id: 'cpu-amd-9700x',
                name: 'AMD Ryzen 7 9700X',
                price: 359,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '8 cores / 16 threads',
                    'Max boost 5.5 GHz',
                    '120W TDP',
                    'AM5 socket',
                    'PCIe 5.0 support'
                ]
            }
        ],
        motherboard_intel: [
            {
                id: 'mb-intel-b660',
                name: 'ASUS B660-Plus',
                price: 139,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'LGA1700 socket',
                    'DDR4/DDR5 support',
                    'PCIe 4.0 x16',
                    '2x M.2 slots',
                    '2.5Gb LAN'
                ]
            },
            {
                id: 'mb-intel-z690',
                name: 'MSI Z690-A Pro',
                price: 219,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'LGA1700 socket',
                    'DDR5 support',
                    'PCIe 5.0 x16',
                    '4x M.2 slots',
                    'Wi-Fi ready'
                ]
            },
            {
                id: 'mb-intel-z790',
                name: 'ASUS ROG Z790-E',
                price: 379,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'LGA1700 socket',
                    'DDR5 up to 7800+',
                    'PCIe 5.0 x16',
                    '5x M.2 slots',
                    'Wi-Fi 6E + 2.5Gb LAN'
                ]
            }
        ],
        motherboard_amd: [
            {
                id: 'mb-amd-b550',
                name: 'ASUS B550-Plus',
                price: 129,
                images: [
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'AM4 socket',
                    'DDR4 support',
                    'PCIe 4.0 x16',
                    '2x M.2 slots',
                    '1Gb LAN'
                ]
            },
            {
                id: 'mb-amd-x670',
                name: 'MSI X670-A Pro',
                price: 259,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'AM5 socket',
                    'DDR5 support',
                    'PCIe 5.0 x16',
                    '4x M.2 slots',
                    'Wi-Fi ready'
                ]
            },
            {
                id: 'mb-amd-x870',
                name: 'ASUS ROG X870-E',
                price: 399,
                images: [
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'AM5 socket',
                    'DDR5 up to 8000+',
                    'PCIe 5.0 x16',
                    '5x M.2 slots',
                    'Wi-Fi 6E + 2.5Gb LAN'
                ]
            }
        ],
        ram: [
            {
                id: 'ram-16gb',
                name: '16GB DDR5 (2x8GB)',
                price: 79,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'DDR5 5600 MT/s',
                    'CL36 timing',
                    '1.25V',
                    'Dual-channel kit',
                    'Low-profile heatspreader'
                ]
            },
            {
                id: 'ram-32gb',
                name: '32GB DDR5 (2x16GB)',
                price: 159,
                images: [
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'DDR5 6000 MT/s',
                    'CL36 timing',
                    '1.25V',
                    'Dual-channel kit',
                    'RGB-ready'
                ]
            },
            {
                id: 'ram-64gb',
                name: '64GB DDR5 (2x32GB)',
                price: 319,
                images: [
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'DDR5 6000 MT/s',
                    'CL40 timing',
                    '1.25V',
                    'Dual-channel kit',
                    'High-capacity modules'
                ]
            }
        ],
        storage: [
            {
                id: 'nvme-1tb',
                name: '1TB NVMe SSD',
                price: 89,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'PCIe 4.0 x4',
                    'Up to 7,000 MB/s read',
                    'Up to 5,000 MB/s write',
                    'M.2 2280',
                    '5-year warranty'
                ]
            },
            {
                id: 'nvme-2tb',
                name: '2TB NVMe SSD',
                price: 169,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'PCIe 4.0 x4',
                    'Up to 7,400 MB/s read',
                    'Up to 6,800 MB/s write',
                    'M.2 2280',
                    'Dynamic SLC cache'
                ]
            },
            {
                id: 'nvme-4tb',
                name: '4TB NVMe SSD',
                price: 349,
                images: [
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'PCIe 4.0 x4',
                    'Up to 7,300 MB/s read',
                    'Up to 6,800 MB/s write',
                    'M.2 2280',
                    'High-endurance NAND'
                ]
            }
        ],
        psu: [
            {
                id: 'psu-650w',
                name: '650W Gold PSU',
                price: 99,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '80 Plus Gold efficiency',
                    'Fully modular cables',
                    'Single +12V rail',
                    '120mm silent fan',
                    '10-year warranty'
                ]
            },
            {
                id: 'psu-850w',
                name: '850W Gold PSU',
                price: 139,
                images: [
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '80 Plus Gold efficiency',
                    'Fully modular cables',
                    'ATX 3.0 ready',
                    '135mm fluid dynamic fan',
                    '10-year warranty'
                ]
            },
            {
                id: 'psu-1000w',
                name: '1000W Gold PSU',
                price: 189,
                images: [
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '80 Plus Gold efficiency',
                    'Fully modular cables',
                    '12VHPWR support',
                    '140mm silent fan',
                    '10-year warranty'
                ]
            }
        ],
        case: [
            {
                id: 'case-mid',
                name: 'Corsair 4000D Airflow',
                price: 79,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'ATX mid-tower',
                    'High-airflow front panel',
                    'Tempered glass side',
                    '2x 120mm fans included',
                    'GPU up to 360mm'
                ]
            },
            {
                id: 'case-full',
                name: 'Fractal Design Meshify',
                price: 129,
                images: [
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'ATX mid-tower',
                    'Mesh front intake',
                    'Tempered glass side',
                    'Up to 7 fans',
                    'Front USB-C'
                ]
            },
            {
                id: 'case-premium',
                name: 'NZXT H7 Flow',
                price: 169,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'ATX mid-tower',
                    'High airflow design',
                    'Tool-less panels',
                    'Cable management channels',
                    'GPU up to 400mm'
                ]
            }
        ],
        cooler: [
            {
                id: 'cooler-air',
                name: 'Noctua NH-D15',
                price: 89,
                images: [
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    'Dual-tower air cooler',
                    '2x 140mm fans',
                    'Low-noise adapters',
                    'Excellent thermal headroom',
                    'Multi-socket support'
                ]
            },
            {
                id: 'cooler-aio-240',
                name: '240mm AIO Cooler',
                price: 109,
                images: [
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '240mm radiator',
                    'ARGB pump block',
                    '2x 120mm fans',
                    'PWM control',
                    '5-year warranty'
                ]
            },
            {
                id: 'cooler-aio-360',
                name: '360mm AIO Cooler',
                price: 159,
                images: [
                    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80',
                    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=1200&q=80'
                ],
                specs: [
                    '360mm radiator',
                    'ARGB pump block',
                    '3x 120mm fans',
                    'PWM control',
                    '6-year warranty'
                ]
            }
        ]
    };

    // ========================================================================
    // MODULE 6: APPLICATION STATE
    // Current user selections and runtime state
    // ========================================================================
    let currentSelection = {
        device: null,
        brand: null,
        model: null,
        repair: null
    };

    let currentBuild = {
        buildType: null,
        serverType: null,
        buildStatus: null,
        osOption: null,
        installOption: null,
        haBrand: null,
        haType: null,
        haModel: null,
        haRam: null,
        haStorageType: null,
        haStorageSize: null,
        haCaseRack: null,
        haSwitch: null,
        haInstallOs: null,
        haCluster: null,
        cpuBrand: null, cpu: null, motherboard: null, ram: null,
        storage: null, psu: null, case: null, cooler: null, rack: null
    };

    const adminPageNode = document.getElementById('admin');
    const adminPageParent = adminPageNode ? adminPageNode.parentNode : null;
    const adminPageNextSibling = adminPageNode ? adminPageNode.nextSibling : null;

    function mountAdminPageNode() {
        if (!adminPageNode || !adminPageParent || adminPageNode.parentNode) return;
        adminPageParent.insertBefore(adminPageNode, adminPageNextSibling);
    }

    function unmountAdminPageNode() {
        if (!adminPageNode || !adminPageNode.parentNode) return;
        adminPageNode.parentNode.removeChild(adminPageNode);
    }


    // ========================================================================
    // MODULE 7: UI & NAVIGATION FUNCTIONS
    // Page navigation and general UI management
    // ========================================================================
    
    /**
     * Navigate to a specific page / section
     * @param {string} pageId - The ID of the page to show
     */
    function showPage(pageId) {
        if (pageId === 'profile' && !Storage.getToken()) {
            showPage('auth');
            return;
        }

        // Prevent access to admin without login
        if (pageId === 'admin') {
            if (!Storage.getToken() || !Storage.adminLoggedIn) {
                if (window.location.hash !== '#home') {
                    window.history.replaceState(null, '', '#home');
                }
                showPage('home');
                showSupportDialog();
                return;
            }
            mountAdminPageNode();
            initAdminBindings();
            ensureAdminChatInboxInitialized();
            if (!window.location.hash || !window.location.hash.includes('email=')) {
                window.adminEmailFilter = null;
            }
            const isOwner = isOwnerRole(Storage.getUser()?.role);
            const credentialsTabBtn = document.querySelector('.admin-tab-btn[data-tab="credentials"]');
            const credentialsContent = document.getElementById('credentials-content');
            const repairsTabBtn = document.querySelector('.admin-tab-btn[data-tab="repairs"]');
            const repairsContent = document.getElementById('repairs-content');
            const canCatalog = canManageCatalog(Storage.getUser());
            const catalogTabBtn = document.querySelector('.admin-tab-btn[data-tab="catalog"]');
            const catalogContent = document.getElementById('catalog-content');
            if (!isOwner) {
                credentialsTabBtn?.classList.remove('active');
                credentialsContent?.classList.remove('active');
                repairsTabBtn?.classList.add('active');
                repairsContent?.classList.add('active');
            }
            if (!canCatalog) {
                catalogTabBtn?.classList.remove('active');
                catalogContent?.classList.remove('active');
                repairsTabBtn?.classList.add('active');
                repairsContent?.classList.add('active');
            }
        }

        const requestedPageId = typeof pageId === 'string' ? pageId : '';
        let targetPage = document.getElementById(requestedPageId);
        if (!targetPage) {
            pageId = 'home';
            targetPage = document.getElementById('home');
            if (!targetPage) return;
        }

        // Hide all pages, show selected one
        DOM.pages.forEach(page => page.classList.remove('active'));
        targetPage.classList.add('active');

        // Update active nav link
        DOM.navPageLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId && !link.classList.contains('btn')) {
                link.classList.add('active');
            }
        });

        // Page-specific initialization
        if (pageId === 'services') {
            resetServiceSelection();
        }
        if (pageId === 'custompc') {
            renderCustomPCPage();
        }
        if (pageId === 'cart') {
            renderCart();
        }
        if (pageId === 'checkout') {
            renderCheckout();
        }
        if (pageId === 'admin') {
            renderAdminOrders();
            if (isOwnerRole(Storage.getUser()?.role)) {
                renderCredentialsUI();
            }
            const chatsTabActive = document.getElementById('chats-content')?.classList.contains('active');
            if (chatsTabActive) {
                ensureAdminChatInboxInitialized();
                loadAdminChatSessions();
                loadAdminChatAiConfig();
            }
        }
        if (pageId === 'printing') {
            renderPrintingPage();
        }
        if (pageId === 'other') {
            renderOtherItemsPage();
        }
        if (pageId === 'used-shop') {
            renderUsedShopPage();
        }
        if (pageId === 'profile') {
            renderProfilePage();
        }

        applyTranslations();
        window.scrollTo(0, 0);
        DOM.mobileMenuBtn?.classList.remove('active');
        DOM.navLinks?.classList.remove('active');
        ensureVisiblePage();
    }

    function ensureVisiblePage() {
        if (document.querySelector('.page.active')) return;
        const homePage = document.getElementById('home');
        if (homePage) {
            homePage.classList.add('active');
        }
    }

    function formatDateTimeSafe(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleString();
    }

    function formatProfileRoleLabel(role) {
        const normalized = String(role || '').toLowerCase();
        if (normalized === 'owner') return 'Owner';
        if (normalized === 'manager') return 'Manager';
        if (normalized === 'worker') return 'Worker';
        if (normalized === 'customer') return 'User';
        return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '-';
    }

    async function renderProfilePage() {
        const messageEl = document.getElementById('profileMessage');
        const ordersListEl = document.getElementById('profileOrdersList');
        const chatsListEl = document.getElementById('profileChatsList');
        const usernameEl = document.getElementById('profileUsername');
        const emailEl = document.getElementById('profileEmail');
        const roleEl = document.getElementById('profileRole');
        const createdEl = document.getElementById('profileCreatedAt');

        if (!ordersListEl || !chatsListEl || !usernameEl || !emailEl || !roleEl || !createdEl) return;

        if (!Storage.getToken()) {
            if (messageEl) messageEl.textContent = 'Please login to view your profile.';
            return;
        }

        ordersListEl.innerHTML = '<div class="profile-empty">Loading your orders...</div>';
        chatsListEl.innerHTML = '<div class="profile-empty">Loading your chats...</div>';
        if (messageEl) messageEl.textContent = '';

        try {
            const meResult = await apiCall('GET', '/auth/me');
            const user = meResult?.user || Storage.getUser() || {};
            Storage.setUser(user);

            usernameEl.textContent = user.username || '-';
            emailEl.textContent = user.email || '-';
            roleEl.textContent = formatProfileRoleLabel(user.role);
            createdEl.textContent = formatDateTimeSafe(user.created_at);

            const [ordersResult, chatsResult] = await Promise.allSettled([
                apiCall('GET', '/orders/mine'),
                apiCall('GET', '/chat/my/sessions')
            ]);

            if (ordersResult.status === 'fulfilled') {
                const orders = Array.isArray(ordersResult.value?.orders) ? ordersResult.value.orders : [];
                if (!orders.length) {
                    ordersListEl.innerHTML = '<div class="profile-empty">No orders yet.</div>';
                } else {
                    const detailsByOrderId = new Map();
                    await Promise.all(orders.map(async (order) => {
                        try {
                            const result = await apiCall('GET', `/orders/${order.id}`);
                            if (result?.success && result.order) {
                                detailsByOrderId.set(String(order.id), result.order);
                            }
                        } catch {
                            // Leave this order without expanded details if loading fails.
                        }
                    }));

                    ordersListEl.innerHTML = orders.map((order) => {
                        const orderIdKey = String(order.id || '');
                        const details = detailsByOrderId.get(orderIdKey);
                        const items = Array.isArray(details?.items) ? details.items : [];

                        const detailRows = [
                            `<div><strong>Service:</strong> ${escapeHtml(formatServiceTypeLabel(details?.service_type || ''))}</div>`,
                            `<div><strong>Payment:</strong> ${escapeHtml(String(details?.payment_method || 'N/A'))}</div>`,
                            `<div><strong>Created:</strong> ${escapeHtml(formatDateTimeSafe(details?.created_at || order.created_at))}</div>`,
                            `<div><strong>Updated:</strong> ${escapeHtml(formatDateTimeSafe(details?.updated_at || order.updated_at))}</div>`
                        ].join('');

                        const itemsHtml = items.length
                            ? `<div class="profile-order-items">${items.map((item) => `
                                <div class="profile-order-item">
                                    <div><strong>${escapeHtml(item.repair_name || item.repair_type || 'Item')}</strong></div>
                                    <div class="meta">${escapeHtml([item.device, item.brand, item.model].filter(Boolean).join(' • '))}</div>
                                    <div class="meta">${escapeHtml(formatCurrency(item.price || 0))}</div>
                                </div>
                            `).join('')}</div>`
                            : '<div class="profile-empty">No item details available.</div>';

                        const detailsHtml = details
                            ? `${detailRows}${itemsHtml}`
                            : '<div class="profile-empty">Order details unavailable.</div>';

                        return `
                            <div class="profile-history-item">
                                <div class="profile-order-header">
                                    <div>
                                        <div class="title">#${escapeHtml(order.order_number || String(order.id || ''))}</div>
                                        <div class="meta">Status: ${escapeHtml(formatStatusLabel(order.status || ''))} • ${escapeHtml(formatDateTimeSafe(order.created_at))}</div>
                                        <div class="preview">Total: ${escapeHtml(formatCurrency(order.total || 0))} • Items: ${escapeHtml(String(order.item_count || 0))}</div>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-secondary profile-order-toggle" data-order-toggle="${escapeHtml(orderIdKey)}" aria-expanded="false">Show details</button>
                                </div>
                                <div class="profile-order-details" data-order-details="${escapeHtml(orderIdKey)}" style="display:none;">
                                    ${detailsHtml}
                                </div>
                            </div>
                        `;
                    }).join('');

                    ordersListEl.querySelectorAll('[data-order-toggle]').forEach((btn) => {
                        btn.addEventListener('click', () => {
                            const orderId = btn.getAttribute('data-order-toggle');
                            if (!orderId) return;
                            const detailsEl = ordersListEl.querySelector(`[data-order-details="${CSS.escape(orderId)}"]`);
                            if (!detailsEl) return;

                            const isVisible = detailsEl.style.display !== 'none';
                            detailsEl.style.display = isVisible ? 'none' : 'block';
                            btn.textContent = isVisible ? 'Show details' : 'Hide details';
                            btn.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
                        });
                    });
                }
            } else {
                ordersListEl.innerHTML = '<div class="profile-empty">Failed to load order history.</div>';
            }

            if (chatsResult.status === 'fulfilled') {
                const sessions = Array.isArray(chatsResult.value?.sessions) ? chatsResult.value.sessions : [];
                if (!sessions.length) {
                    chatsListEl.innerHTML = '<div class="profile-empty">No chats yet.</div>';
                } else {
                    const previewSessions = sessions.slice(0, 8);
                    chatsListEl.innerHTML = previewSessions.map((session) => {
                        const sessionId = String(session.id || '');
                        const status = escapeHtml(formatStatusLabel(session.status || 'open'));
                        const when = escapeHtml(formatDateTimeSafe(session.last_message_at || session.created_at));
                        const preview = escapeHtml(String(session.last_message || 'No messages yet'));

                        return `
                            <div class="profile-history-item">
                                <div class="profile-chat-header">
                                    <div>
                                        <div class="title">Chat ${escapeHtml(sessionId)}</div>
                                        <div class="meta">${status} • ${when}</div>
                                        <div class="preview">${preview}</div>
                                    </div>
                                    <button type="button" class="btn btn-sm btn-secondary profile-chat-toggle" data-chat-toggle="${escapeHtml(sessionId)}" aria-expanded="false">Show chat</button>
                                </div>
                                <div class="profile-chat-transcript" data-chat-transcript="${escapeHtml(sessionId)}" data-chat-loaded="false" style="display:none;"></div>
                            </div>
                        `;
                    }).join('');

                    chatsListEl.querySelectorAll('[data-chat-toggle]').forEach((btn) => {
                        btn.addEventListener('click', async () => {
                            const sessionId = btn.getAttribute('data-chat-toggle');
                            if (!sessionId) return;
                            const transcriptEl = chatsListEl.querySelector(`[data-chat-transcript="${CSS.escape(sessionId)}"]`);
                            if (!transcriptEl) return;

                            const isVisible = transcriptEl.style.display !== 'none';
                            if (isVisible) {
                                transcriptEl.style.display = 'none';
                                btn.textContent = 'Show chat';
                                btn.setAttribute('aria-expanded', 'false');
                                return;
                            }

                            transcriptEl.style.display = 'block';
                            btn.textContent = 'Hide chat';
                            btn.setAttribute('aria-expanded', 'true');

                            if (transcriptEl.dataset.chatLoaded === 'true') {
                                return;
                            }

                            transcriptEl.innerHTML = '<div class="profile-empty">Loading chat transcript...</div>';
                            try {
                                const result = await apiCall('GET', `/chat/my/sessions/${sessionId}/messages`);
                                const messages = Array.isArray(result?.messages) ? result.messages : [];
                                if (!messages.length) {
                                    transcriptEl.innerHTML = '<div class="profile-empty">No messages in this chat.</div>';
                                    transcriptEl.dataset.chatLoaded = 'true';
                                    return;
                                }

                                transcriptEl.innerHTML = messages.map((msg) => {
                                    const type = String(msg.sender_type || '').toLowerCase();
                                    const klass = type === 'user' ? 'user' : (type === 'admin' ? 'admin' : 'bot');
                                    const sender = escapeHtml(msg.sender_name || msg.sender_type || 'message');
                                    const text = escapeHtml(String(msg.message || ''));
                                    const time = escapeHtml(formatDateTimeSafe(msg.created_at));
                                    return `
                                        <div class="profile-chat-message-row ${klass}">
                                            <div class="profile-chat-message"><strong>${sender}:</strong> ${text}</div>
                                            <div class="meta">${time}</div>
                                        </div>
                                    `;
                                }).join('');

                                transcriptEl.dataset.chatLoaded = 'true';
                            } catch {
                                transcriptEl.innerHTML = '<div class="profile-empty">Failed to load chat transcript.</div>';
                            }
                        });
                    });
                }
            } else {
                chatsListEl.innerHTML = '<div class="profile-empty">Failed to load chat history.</div>';
            }

            if (messageEl) messageEl.textContent = '';
        } catch (error) {
            if (messageEl) messageEl.textContent = 'Failed to load profile data. Please try again.';
            ordersListEl.innerHTML = '<div class="profile-empty">Failed to load order history.</div>';
            chatsListEl.innerHTML = '<div class="profile-empty">Failed to load chat history.</div>';
        }
    }

    function renderPrintingPage() {
        // Ensure colors is initialized
        if (!printingState.colors || !Array.isArray(printingState.colors)) {
            printingState.colors = [];
        }
        if (typeof printingState.colorSlotIndex !== 'number') {
            printingState.colorSlotIndex = 0;
        }
        
        const printerGrid = document.getElementById('printerGrid');
        const filamentGrid = document.getElementById('filamentGrid');
        const colorGrid = document.getElementById('colorGrid');
        const multicolorSlotsContainer = document.getElementById('multicolorSlotsContainer');
        const colorSlotTabs = document.getElementById('colorSlotTabs');
        const colorSlotGrid = document.getElementById('colorSlotGrid');
        const strengthGrid = document.getElementById('strengthGrid');
        const partsCount = document.getElementById('partsCount');
        const fileInput = document.getElementById('printingFile');
        const fileName = document.getElementById('printingFileName');
        const addToCartBtn = document.getElementById('printingAddToCartBtn');

        const getLabel = (list, id) => {
            const match = (list || []).find(item => item.id === id);
            return match ? match.name : id;
        };

        const isMulticolorPrinter = () => {
            if (!printingState.printer) return false;
            const printer = printingOptions.printers.find(p => p.id === printingState.printer);
            return printer && printer.multicolor === true;
        };

        const updateColorDisplay = () => {
            // Ensure colors is always an array
            if (!printingState.colors || !Array.isArray(printingState.colors)) {
                printingState.colors = [];
            }

            const isMulti = isMulticolorPrinter();

            if (isMulti) {
                if (colorGrid) colorGrid.style.display = 'none';
                if (multicolorSlotsContainer) {
                    multicolorSlotsContainer.style.display = 'flex';
                    multicolorSlotsContainer.classList.remove('is-visible');
                    requestAnimationFrame(() => {
                        multicolorSlotsContainer.classList.add('is-visible');
                    });
                    renderMulticolorSlots();
                }
            } else {
                if (colorGrid) colorGrid.style.display = 'grid';
                if (multicolorSlotsContainer) {
                    multicolorSlotsContainer.classList.remove('is-visible');
                    multicolorSlotsContainer.style.display = 'none';
                }
                // Reset to single color mode
                if (printingState.colors && printingState.colors.length > 0) {
                    printingState.colors = [printingState.colors[0]];
                } else {
                    printingState.colors = [];
                }
                printingState.colorSlotIndex = 0;
            }
        };

        const renderMulticolorSlots = () => {
            const colors = filterActiveItems(printingOptions.colors || []);
            const labels = [t('Color 1'), t('Color 2'), t('Color 3'), t('Color 4'), t('Color 5')];
            const activeIndex = Math.min(Math.max(printingState.colorSlotIndex || 0, 0), 4);
            printingState.colorSlotIndex = activeIndex;

            if (colorSlotTabs) {
                colorSlotTabs.innerHTML = labels.map((label, index) => `
                    <button class="color-slot-tab${index === activeIndex ? ' active' : ''}" data-slot="${index}">${label}</button>
                `).join('');
                colorSlotTabs.querySelectorAll('.color-slot-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        printingState.colorSlotIndex = parseInt(tab.dataset.slot, 10) || 0;
                        renderMulticolorSlots();
                    });
                });
            }

            if (colorSlotGrid) {
                colorSlotGrid.innerHTML = colors.map(color => `
                    <div class="brand-card" data-color="${color.id}" data-slot="${activeIndex}">
                        <span class="color-chip" style="background:${color.hex || '#94a3b8'}"></span>
                        <h3>${color.name}</h3>
                    </div>
                `).join('');

                colorSlotGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const slotIndex = parseInt(card.dataset.slot, 10);
                        printingState.colors[slotIndex] = card.dataset.color;
                        markSelected(colorSlotGrid, 'color', printingState.colors[slotIndex]);
                    });
                });

                markSelected(colorSlotGrid, 'color', printingState.colors[activeIndex]);
            }
        };

        if (printerGrid) {
            const printers = filterActiveItems(printingOptions.printers || []);
            printerGrid.innerHTML = printers.map(printer => `
                <div class="brand-card" data-printer="${printer.id}">
                    ${printer.image ? `<div class="part-media printer-media"><img src="${printer.image}" alt="${printer.name}" loading="lazy" decoding="async"></div>` : ''}
                    <h3>${printer.name}</h3>
                    ${printer.desc ? `<p class="part-price">${printer.desc}</p>` : ''}
                </div>
            `).join('');
        }

        if (filamentGrid) {
            const filaments = filterActiveItems(printingOptions.filaments || []);
            filamentGrid.innerHTML = filaments.map(filament => `
                <div class="brand-card" data-filament="${filament.id}"><h3>${filament.name}</h3></div>
            `).join('');
        }

        if (colorGrid) {
            const colors = filterActiveItems(printingOptions.colors || []);
            colorGrid.innerHTML = colors.map(color => `
                <div class="brand-card" data-color="${color.id}">
                    <span class="color-chip" style="background:${color.hex || '#94a3b8'}"></span>
                    <h3>${color.name}</h3>
                </div>
            `).join('');
        }

        if (strengthGrid) {
            const strengths = filterActiveItems(printingOptions.strengths || defaultPrintingStrengths);
            strengthGrid.innerHTML = strengths.map(strength => `
                <div class="brand-card" data-strength="${strength.id}"><h3>${strength.name}</h3></div>
            `).join('');
        }

        const markSelected = (grid, datasetKey, value) => {
            if (!grid) return;
            grid.querySelectorAll('.brand-card').forEach(card => {
                card.classList.toggle('active', card.dataset[datasetKey] === value);
            });
        };

        if (printerGrid) {
            printerGrid.querySelectorAll('.brand-card').forEach(card => {
                card.addEventListener('click', () => {
                    printingState.printer = card.dataset.printer;
                    printingState.colors = []; // Reset colors when changing printer
                    printingState.colorSlotIndex = 0;
                    markSelected(printerGrid, 'printer', printingState.printer);
                    updateColorDisplay();
                });
            });
            markSelected(printerGrid, 'printer', printingState.printer);
        }

        // Initialize color display
        updateColorDisplay();

        if (filamentGrid) {
            filamentGrid.querySelectorAll('.brand-card').forEach(card => {
                card.addEventListener('click', () => {
                    printingState.filament = card.dataset.filament;
                    markSelected(filamentGrid, 'filament', printingState.filament);
                });
            });
            markSelected(filamentGrid, 'filament', printingState.filament);
        }

        if (colorGrid) {
            colorGrid.querySelectorAll('.brand-card').forEach(card => {
                card.addEventListener('click', () => {
                    printingState.colors = [card.dataset.color];
                    markSelected(colorGrid, 'color', printingState.colors[0]);
                });
            });
            markSelected(colorGrid, 'color', printingState.colors[0]);
        }

        if (strengthGrid) {
            strengthGrid.querySelectorAll('.brand-card').forEach(card => {
                card.addEventListener('click', () => {
                    printingState.strength = card.dataset.strength;
                    markSelected(strengthGrid, 'strength', printingState.strength);
                });
            });
            markSelected(strengthGrid, 'strength', printingState.strength);
        }

        if (partsCount) {
            partsCount.value = printingState.parts || 1;
            partsCount.addEventListener('input', () => {
                const value = parseInt(partsCount.value, 10);
                printingState.parts = Number.isNaN(value) || value < 1 ? 1 : value;
                partsCount.value = printingState.parts;
            });
        }

        if (fileInput && fileName) {
            fileName.textContent = printingState.fileName || 'No file selected';
            fileInput.addEventListener('change', () => {
                const file = fileInput.files && fileInput.files[0];
                printingState.fileName = file ? file.name : '';
                fileName.textContent = printingState.fileName || 'No file selected';
            });
        }

        if (addToCartBtn) {
            addToCartBtn.onclick = async () => {
                if (!printingState.printer || !printingState.filament || !printingState.colors || printingState.colors.length === 0 || !printingState.strength || !printingState.fileName) {
                    showToast('Select printer, filament, color, strength, and upload a file');
                    return;
                }

                // Build color data
                const colorIds = (printingState.colors || []).filter(c => c); // Remove empty slots
                const colorNames = colorIds.map(colorId => getLabel(printingOptions.colors, colorId)).join(', ');

                const printingItem = {
                    id: Date.now(),
                    device: 'printing',
                    deviceName: '3D Printing',
                    repairType: '3d-printing',
                    repairName: '3D Printing',
                    repairDesc: '3D printing request',
                    price: 0,
                    printer: printingState.printer,
                    printerName: getLabel(printingOptions.printers, printingState.printer),
                    filament: printingState.filament,
                    filamentName: getLabel(printingOptions.filaments, printingState.filament),
                    colors: colorIds,
                    colorNames: colorNames,
                    strength: printingState.strength,
                    strengthName: getLabel(printingOptions.strengths || defaultPrintingStrengths, printingState.strength),
                    parts: printingState.parts || 1,
                    fileName: printingState.fileName
                };

                try {
                    if (!Storage.getToken()) {
                        Storage.cart.push(printingItem);
                        await Storage.saveCart();
                    } else {
                        await apiCall('POST', '/cart', printingItem);
                        await Storage.loadCart();
                    }
                    await updateCartCount();
                    showToast('3D printing added to cart');
                } catch (error) {
                    console.error('Error adding 3D printing to cart:', error);
                    showToast('Failed to add 3D printing to cart');
                }
            };
        }
    }

    function renderOtherItemsPage() {
        const grid = document.getElementById('otherItemsGrid');
        if (!grid) return;

        const items = filterActiveItems(printingOptions.otherItems || defaultOtherItems);

        if (!items.length) {
            grid.innerHTML = `<div class="no-orders"><h3>${t('No items')}</h3><p>${t('No items yet')}</p></div>`;
            return;
        }

        grid.innerHTML = items.map(item => {
            const imageHtml = item.image
                ? `<img src="${item.image}" alt="${escapeHtml(item.name || '')}" loading="lazy" decoding="async">`
                : `<div class="other-item-placeholder">${t('No image')}</div>`;
            const price = typeof item.price === 'number' ? formatCurrency(item.price) : '';
            const defaultDesc = item.desc || item.description || item.details || item.detail || '';
            const contactDesc = item.contactDescription || item.contactText || '';
            const desc = item.showContact ? (contactDesc || defaultDesc) : defaultDesc;
            const actionButtonHtml = item.showContact
                ? `<button class="btn btn-primary" data-other-action="contact" data-other-id="${item.id}">${t('Contact')}</button>`
                : `<button class="btn btn-primary" data-other-action="add-to-cart" data-other-id="${item.id}">${t('Add to Cart')}</button>`;
            return `
                <div class="other-item-card" data-other-id="${item.id}">
                    <div class="other-item-media">${imageHtml}</div>
                    <div class="other-item-body">
                        <h3 class="other-item-title">${escapeHtml(item.name || t('Other Item'))}</h3>
                        ${desc ? `<p class="other-item-desc">${escapeHtml(desc)}</p>` : ''}
                        <div class="other-item-price">${price}</div>
                        <div class="other-item-actions">
                            <button class="btn btn-secondary" data-other-action="details" data-other-id="${item.id}">${t('Details')}</button>
                            ${actionButtonHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('[data-other-action="details"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = items.find(i => i.id === btn.dataset.otherId);
                if (item) openOtherDetails(item);
            });
        });

        grid.querySelectorAll('[data-other-action="contact"]').forEach(btn => {
            btn.addEventListener('click', () => {
                openContactModal();
            });
        });

        grid.querySelectorAll('[data-other-action="add-to-cart"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = items.find(i => i.id === btn.dataset.otherId);
                if (item) {
                    const cartItem = {
                        device: 'other-item',
                        id: item.id,
                        name: item.name,
                        desc: item.desc || item.description || item.details || item.detail || '',
                        details: item.details || item.detail || item.desc || item.description || '',
                        price: item.price,
                        image: item.image
                    };
                    (async () => {
                        try {
                            if (!Storage.getToken()) {
                                Storage.cart.push(cartItem);
                                await Storage.saveCart();
                            } else {
                                await apiCall('POST', '/cart', cartItem);
                                await Storage.loadCart();
                            }
                            await updateCartCount();
                            showToast(`${item.name} ${t('added to cart')}`, 'success');
                        } catch (error) {
                            console.error('Error adding other item to cart:', error);
                            showToast('Failed to add item to cart');
                        }
                    })();
                }
            });
        });

        const modal = document.getElementById('otherDetailsModal');
        const overlay = modal?.querySelector('.part-details-overlay');
        const closeBtn = document.getElementById('otherDetailsClose');
        if (overlay) overlay.onclick = closeOtherDetails;
        if (closeBtn) closeBtn.onclick = closeOtherDetails;
    }

    let activeUsedShopItem = null;

    function getUsedShopImages(item) {
        const rawImages = Array.isArray(item?.images) ? item.images : [];
        const withFallback = rawImages.length > 0 ? rawImages : [item?.image || ''];
        return withFallback.filter(Boolean);
    }

    async function addUsedItemToCart(item) {
        if (!item) return;

        const firstImage = getUsedShopImages(item)[0] || item.image || '';
        const cartItem = {
            device: 'other-item',
            deviceName: 'Bazar',
            brand: item.brand || 'Used Device',
            brandName: item.brand || 'Used Device',
            model: item.model || item.name || 'Used Device',
            repairType: 'used-device',
            repairName: item.name || 'Used Device',
            repairDesc: item.details || item.shortDesc || item.desc || '',
            price: Number(item.price || 0),
            otherItemName: item.name || 'Used Device',
            otherItemDesc: item.shortDesc || item.desc || item.details || '',
            otherItemImage: firstImage,
            image: firstImage
        };

        try {
            if (!Storage.getToken()) {
                Storage.cart.push(cartItem);
                await Storage.saveCart();
            } else {
                await apiCall('POST', '/cart', cartItem);
                await Storage.loadCart();
            }
            await updateCartCount();
            showToast(`${item.name || t('Item')} ${t('added to cart')}`, 'success');
        } catch (error) {
            console.error('Error adding used shop item to cart:', error);
            showToast('Failed to add item to cart');
        }
    }

    function renderUsedShopPage() {
        const grid = document.getElementById('usedShopGrid');
        if (!grid) return;

        const items = filterActiveItems(printingOptions.usedShopItems || defaultUsedShopItems);
        if (!items.length) {
            grid.innerHTML = `<div class="no-orders"><h3>${t('No items')}</h3><p>${t('No items yet')}</p></div>`;
            return;
        }

        grid.innerHTML = items.map((item) => {
            const image = getUsedShopImages(item)[0] || '';
            const previewDesc = item.shortDesc || item.desc || item.details || item.description || '';

            return `
                <article class="used-item-card" data-used-id="${escapeHtml(item.id || '')}">
                    <div class="used-item-media">
                        ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.name || 'Used device')}" loading="lazy" decoding="async">` : `<div class="other-item-placeholder">${t('No image')}</div>`}
                    </div>
                    <div class="used-item-body">
                        <h3 class="used-item-title">${escapeHtml(item.name || 'Used Device')}</h3>
                        ${previewDesc ? `<p class="used-item-desc">${escapeHtml(previewDesc)}</p>` : ''}
                        <div class="used-item-price">${formatCurrency(Number(item.price || 0))}</div>
                        <div class="used-item-actions">
                            <button class="btn btn-secondary" data-used-action="details" data-used-id="${escapeHtml(item.id || '')}">View details</button>
                            <button class="btn btn-primary" data-used-action="add-to-cart" data-used-id="${escapeHtml(item.id || '')}">Add to Cart</button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        grid.querySelectorAll('[data-used-action="details"]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const item = items.find((entry) => String(entry.id) === String(btn.getAttribute('data-used-id')));
                if (item) openUsedDetails(item);
            });
        });

        grid.querySelectorAll('[data-used-action="add-to-cart"]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const item = items.find((entry) => String(entry.id) === String(btn.getAttribute('data-used-id')));
                if (item) {
                    await addUsedItemToCart(item);
                }
            });
        });

        const modal = document.getElementById('usedDetailsModal');
        const overlay = modal?.querySelector('.part-details-overlay');
        const closeBtn = document.getElementById('usedDetailsClose');
        const prevBtn = document.getElementById('usedThumbsPrev');
        const nextBtn = document.getElementById('usedThumbsNext');
        const thumbsEl = document.getElementById('usedDetailsThumbs');
        const addBtn = document.getElementById('usedDetailsAddToCart');

        if (overlay) overlay.onclick = closeUsedDetails;
        if (closeBtn) closeBtn.onclick = closeUsedDetails;
        if (prevBtn && thumbsEl) prevBtn.onclick = () => thumbsEl.scrollBy({ left: -220, behavior: 'smooth' });
        if (nextBtn && thumbsEl) nextBtn.onclick = () => thumbsEl.scrollBy({ left: 220, behavior: 'smooth' });
        if (addBtn && !addBtn.dataset.bound) {
            addBtn.dataset.bound = '1';
            addBtn.addEventListener('click', async () => {
                if (activeUsedShopItem) {
                    await addUsedItemToCart(activeUsedShopItem);
                }
            });
        }
    }

    function openUsedDetails(item) {
        const modal = document.getElementById('usedDetailsModal');
        const nameEl = document.getElementById('usedDetailsName');
        const titleEl = document.getElementById('usedDetailsTitle');
        const priceEl = document.getElementById('usedDetailsPrice');
        const mainImageEl = document.getElementById('usedDetailsMainImage');
        const thumbsEl = document.getElementById('usedDetailsThumbs');
        const descEl = document.getElementById('usedDetailsDesc');
        const specsEl = document.getElementById('usedDetailsSpecs');
        if (!modal || !nameEl || !titleEl || !priceEl || !mainImageEl || !thumbsEl || !descEl || !specsEl) return;

        activeUsedShopItem = item;
        const images = getUsedShopImages(item);
        const title = item.name || 'Used Device';
        const details = item.details || item.description || item.shortDesc || item.desc || '';

        nameEl.textContent = title;
        titleEl.textContent = title;
        priceEl.textContent = formatCurrency(Number(item.price || 0));
        descEl.textContent = details;

        const firstImage = images[0] || '';
        mainImageEl.src = firstImage;
        mainImageEl.alt = title;

        thumbsEl.innerHTML = images.map((img, index) => `
            <img src="${escapeHtml(img)}" alt="${escapeHtml(title)} ${index + 1}" class="${index === 0 ? 'active' : ''}" loading="lazy" decoding="async" data-used-thumb="${index}">
        `).join('');

        thumbsEl.querySelectorAll('[data-used-thumb]').forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                const nextImage = images[index] || firstImage;
                mainImageEl.src = nextImage;
                mainImageEl.alt = `${title} ${index + 1}`;
                thumbsEl.querySelectorAll('img').forEach((img) => img.classList.remove('active'));
                thumb.classList.add('active');
            });
        });

        const specs = Array.isArray(item.specs) ? item.specs : [];
        specsEl.innerHTML = specs.length
            ? specs.map((spec) => `<li>${escapeHtml(spec)}</li>`).join('')
            : `<li>${t('No details yet')}</li>`;

        modal.classList.remove('hidden');
        modal.style.display = '';
    }

    function closeUsedDetails() {
        const modal = document.getElementById('usedDetailsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function openOtherDetails(item) {
        const modal = document.getElementById('otherDetailsModal');
        const titleEl = document.getElementById('otherDetailsTitle');
        const priceEl = document.getElementById('otherDetailsPrice');
        const imageEl = document.getElementById('otherDetailsImage');
        const descEl = document.getElementById('otherDetailsDesc');
        const specsEl = document.getElementById('otherDetailsSpecs');
        if (!modal || !titleEl || !priceEl || !imageEl || !descEl || !specsEl) return;

        titleEl.textContent = item.name || t('Other Item');
        priceEl.textContent = typeof item.price === 'number' ? formatCurrency(item.price) : '';
        imageEl.src = item.image || '';
        imageEl.alt = item.name || t('Other Item');
        descEl.textContent = item.details || item.detail || item.desc || item.description || '';

        const specs = Array.isArray(item.specs) ? item.specs : [];
        specsEl.innerHTML = specs.length
            ? specs.map(s => `<li>${escapeHtml(s)}</li>`).join('')
            : `<li>${t('No details yet')}</li>`;

        modal.classList.remove('hidden');
        modal.style.display = '';
    }

    function closeOtherDetails() {
        const modal = document.getElementById('otherDetailsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function openContactModal() {
        const modal = document.getElementById('contactModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = '';
    }

    function closeContactModal() {
        const modal = document.getElementById('contactModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function setupResetPanels(token = '', email = '') {
        const requestPanel = document.getElementById('resetRequestPanel');
        const confirmPanel = document.getElementById('resetConfirmPanel');
        const tokenInput = document.getElementById('resetToken');
        const emailInput = document.getElementById('resetConfirmEmail');

        if (token && email) {
            if (requestPanel) requestPanel.classList.remove('active');
            if (confirmPanel) confirmPanel.classList.add('active');
            if (tokenInput) tokenInput.value = token;
            if (emailInput) emailInput.value = email;
        } else {
            if (confirmPanel) confirmPanel.classList.remove('active');
            if (requestPanel) requestPanel.classList.add('active');
        }
    }

    function handleHashNavigation() {
        const rawHash = window.location.hash || '';
        const cleaned = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
        if (!cleaned) return;

        const [pageId, queryString] = cleaned.split('?');
        if (!pageId) return;

        if (pageId === 'oauth') {
            const params = new URLSearchParams(queryString || '');
            const token = params.get('token');
            const error = params.get('error');
            const created = params.get('created') === '1';
            const userPayload = params.get('user');

            if (token) {
                Storage.setToken(token);

                if (userPayload) {
                    try {
                        const decoded = JSON.parse(atob(userPayload));
                        if (decoded && typeof decoded === 'object') {
                            Storage.setUser(decoded);
                            Storage.setAdminLoggedIn(canAccessAdmin(decoded));
                        }
                    } catch {
                        // Ignore malformed payload and fallback to /auth/me refresh.
                    }
                }

                refreshAuthState().finally(() => {
                    updateAuthUI();
                    const currentUser = Storage.getUser();
                    showToast(created ? 'Google account registered successfully' : 'Login successful');
                    const targetPage = canAccessAdmin(currentUser) ? 'admin' : 'home';
                    showPage(targetPage);
                    window.history.replaceState(null, '', `#${targetPage}`);
                });
            } else if (error) {
                showToast('Google login failed. Please try again.');
                showPage('auth');
                window.history.replaceState(null, '', '#auth');
            }
            return;
        }

        if (pageId === 'reset-password') {
            const params = new URLSearchParams(queryString || '');
            const token = params.get('token') || '';
            const email = params.get('email') || '';
            showPage('reset-password');
            setupResetPanels(token, email);
            return;
        }

        showPage(pageId);

        if (pageId === 'admin') {
            const params = new URLSearchParams(queryString || '');
            const emailParam = (params.get('email') || '').trim().toLowerCase();
            window.adminEmailFilter = emailParam || null;
        } else {
            window.adminEmailFilter = null;
        }

        if (pageId === 'track') {
            const params = new URLSearchParams(queryString || '');
            const orderParam = normalizeOrderNumber(params.get('order') || '');
            const emailParam = params.get('email') || '';

            if (DOM.trackOrderNumber) DOM.trackOrderNumber.value = orderParam;
            if (DOM.trackEmail) DOM.trackEmail.value = emailParam;

            if (orderParam && emailParam) {
                trackOrderLookup(orderParam, emailParam, { auto: true });
            }
        }
    }

    /**
     * Reset service selection flow to step 1 (device selection)
     */
    function resetServiceSelection() {
        currentSelection = { device: null, brand: null, model: null, repair: null };
        showStep(1);
        updateProgressSteps(1);
    }

    /**
     * Show a specific step in the service selection flow (1-4)
     * @param {number} step - Step number (1, 2, 3, or 4)
     */
    function showStep(step) {
        document.querySelectorAll('.service-step').forEach(s => s.classList.remove('active'));
        const stepMap = { 1: 'deviceStep', 2: 'brandStep', 3: 'modelStep', 4: 'repairStep' };
        document.getElementById(stepMap[step])?.classList.add('active');
    }

    /**
     * Update progress indicators for service selection steps
     * @param {number} currentStep - Current step number
     */
    function updateProgressSteps(currentStep) {
        const progressRoot = document.querySelector('#services .progress-steps');
        if (!progressRoot) return;

        progressRoot.querySelectorAll('.step-item').forEach((item, index) => {
            const stepNum = index + 1;
            item.classList.remove('active', 'completed');
            if (stepNum < currentStep) {
                item.classList.add('completed');
                item.querySelector('.step-circle').innerHTML = '';
            } else if (stepNum === currentStep) {
                item.classList.add('active');
                item.querySelector('.step-circle').innerHTML = stepNum;
            } else {
                item.querySelector('.step-circle').innerHTML = stepNum;
            }
        });

        progressRoot.querySelectorAll('.step-line').forEach((line, index) => {
            line.classList.toggle('active', index < currentStep - 1);
        });
    }

    /**
     * Display a toast notification message
     * @param {string} message - Message to display
     */
    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        const span = document.createElement('span');
        span.textContent = t(message);
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
        
        toast.appendChild(svg);
        toast.appendChild(span);
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    const VISITOR_ID_KEY = 'visitor_id';

    function getOrCreateVisitorId() {
        let visitorId = localStorage.getItem(VISITOR_ID_KEY);
        if (visitorId) return visitorId;
        visitorId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
        return visitorId;
    }

    async function sendPresenceHeartbeat() {
        try {
            const visitorId = getOrCreateVisitorId();
            await fetch(`${API_BASE_URL}/presence/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ visitorId })
            });
        } catch {
            // Presence tracking should never block app UX
        }
    }

    async function refreshActiveVisitorsStat() {
        try {
            const response = await fetch(`${API_BASE_URL}/presence/active`);
            if (!response.ok) return;
            const result = await response.json();
            if (!result || !result.success) return;
            const activeVisitorsEl = document.getElementById('activeVisitors');
            if (activeVisitorsEl) {
                activeVisitorsEl.textContent = String(result.activeVisitors || 0);
            }
        } catch {
            // Ignore if presence endpoint is temporarily unavailable
        }
    }

    const COOKIE_CONSENT_KEY = 'cookie_consent_choice';
    const COOKIE_CONSENT_TS_KEY = 'cookie_consent_ts';
    const COOKIE_CONSENT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
    const COOKIE_CONSENT_VERSION_KEY = 'cookie_consent_version';
    const COOKIE_CONSENT_CURRENT_VERSION = '2026-02-19';

    function hideCookieConsent(animated = false) {
        if (!DOM.cookieConsent) return;
        if (!animated) {
            DOM.cookieConsent.classList.remove('is-closing');
            DOM.cookieConsent.classList.add('hidden');
            return;
        }

        DOM.cookieConsent.classList.add('is-closing');
        setTimeout(() => {
            DOM.cookieConsent?.classList.remove('is-closing');
            DOM.cookieConsent?.classList.add('hidden');
        }, 240);
    }

    function showCookieConsent() {
        if (!DOM.cookieConsent) return;
        DOM.cookieConsent.classList.remove('hidden', 'is-closing');
    }

    function saveCookieConsent(choice) {
        localStorage.setItem(COOKIE_CONSENT_KEY, choice);
        localStorage.setItem(COOKIE_CONSENT_TS_KEY, String(Date.now()));
        localStorage.setItem(COOKIE_CONSENT_VERSION_KEY, COOKIE_CONSENT_CURRENT_VERSION);
        hideCookieConsent(true);
    }

    function initCookieConsent() {
        if (!DOM.cookieConsent) return;
        const savedChoice = localStorage.getItem(COOKIE_CONSENT_KEY);
        const savedTimestamp = Number(localStorage.getItem(COOKIE_CONSENT_TS_KEY) || 0);
        const savedVersion = localStorage.getItem(COOKIE_CONSENT_VERSION_KEY) || '';
        const hasValidAcceptanceWindow = savedTimestamp > 0
            && (Date.now() - savedTimestamp) < COOKIE_CONSENT_MAX_AGE_MS;
        const isCurrentVersion = savedVersion === COOKIE_CONSENT_CURRENT_VERSION;

        if (savedChoice === 'accepted' && hasValidAcceptanceWindow && isCurrentVersion) {
            hideCookieConsent(false);
            return;
        }
        showCookieConsent();
    }

    // ========================================================================
    // MODULE 8: SERVICE SELECTION FUNCTIONS
    // Step-by-step device repair service selection
    // ========================================================================

    /**
     * Handle device type selection (phone, tablet, notebook, pc, printer)
     * @param {string} device - Device type ID
     */
    function selectDevice(device) {
        currentSelection.device = device;
        currentSelection.brand = null;
        currentSelection.model = null;

        const data = serviceData[device];
        document.getElementById('deviceTypeName').textContent = data.name;

        const headerIcon = document.getElementById('brandHeaderIcon');
        headerIcon.className = `step-header-icon ${data.icon}`;
        headerIcon.innerHTML = deviceIconSvg[device];

        const brandGrid = document.getElementById('brandGrid');
        const activeBrands = (data.brands || []).filter(isActiveItem);
        brandGrid.innerHTML = activeBrands.map(brand => `
            <div class="brand-card" data-brand="${brand.id}">
                <div class="brand-logo">${getBrandDisplay(brand.id)}</div>
                <h3>${brand.name}</h3>
            </div>
        `).join('');

        brandGrid.querySelectorAll('.brand-card').forEach(card => {
            card.addEventListener('click', () => selectBrand(card.dataset.brand));
        });

        // Attach image load/error handlers: replace tiny or failed external logos with generated badge SVG
        brandGrid.querySelectorAll('.brand-logo img.brand-img').forEach(img => {
            const brandIdForImg = img.getAttribute('data-brand') || img.alt || '';
            img.addEventListener('error', function() {
                try {
                    this.parentNode.innerHTML = generateBadgeHTML(brandIdForImg);
                } catch {
                    this.parentNode.textContent = img.alt || '';
                }
            });
            img.addEventListener('load', function() {
                try {
                    if (this.naturalWidth && this.naturalHeight && (this.naturalWidth < 36 || this.naturalHeight < 28)) {
                        this.parentNode.innerHTML = generateBadgeHTML(brandIdForImg);
                    }
                } catch {
                    // ignore
                }
            });
        });

        showStep(2);
        updateProgressSteps(2);
    }

    /**
     * Get brand logo HTML for display
     * @param {string} brandId - Brand identifier
     * @returns {string} HTML for brand logo
     */
    function getBrandDisplay(brandId) {
        const imgSrc = (location.protocol === 'file:' || location.origin === 'null')
            ? `assets/logos/${brandId}.svg`
            : `/assets/logos/${brandId}.svg`;
        return `<img src="${imgSrc}" alt="${brandId}" class="brand-img" data-brand="${brandId}" loading="lazy" decoding="async" />`;
    }

    /**
     * Generate a simple badge-style SVG for a brand (used when logo files are tiny or unavailable)
     */
    function generateBadgeHTML(brandId) {
        const colorMap = {
            apple: '#111827', samsung: '#1428A0', google: '#4285F4', oneplus: '#EB001B', xiaomi: '#FF6A00',
            creality: '#2D8F6F', prusa: '#E53935', anycubic: '#1E88E5', elegoo: '#7B61FF', ender: '#F97316',
            formlabs: '#0F172A', flashforge: '#FF4455', stratasys: '#005EB8', other: '#6B7280'
        };
        const color = colorMap[brandId] || colorMap.other;
        const label = brandId ? (brandId.charAt(0).toUpperCase() + brandId.slice(1)) : 'Brand';
        const safeLabel = escapeHtml(label);
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${safeLabel} logo"><text x="50%" y="52%" fill="${color}" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="18" text-anchor="middle" dominant-baseline="middle">${safeLabel}</text></svg>`;
    }

    /**
     * Handle brand selection
     * @param {string} brand - Brand ID
     */
    function selectBrand(brand) {
        currentSelection.brand = brand;
        currentSelection.model = null;

        const data = serviceData[currentSelection.device];
        const brandData = data.brands.find(b => b.id === brand);

        document.getElementById('brandName').textContent = brandData.name;

        const headerIcon = document.getElementById('modelHeaderIcon');
        headerIcon.className = `step-header-icon ${data.icon}`;
        headerIcon.innerHTML = deviceIconSvg[currentSelection.device];

        const rawModels = data.models[brand] || ['Other Model'];
        const models = rawModels
            .filter(model => (typeof model === 'string' ? true : isActiveItem(model)))
            .map(model => (typeof model === 'string' ? model : model.name));
        const modelGrid = document.getElementById('modelGrid');
        modelGrid.innerHTML = models.map(model => `
            <div class="model-card" data-model="${model}">${model}</div>
        `).join('');

        modelGrid.querySelectorAll('.model-card').forEach(card => {
            card.addEventListener('click', () => selectModel(card.dataset.model));
        });

        showStep(3);
        updateProgressSteps(3);
    }

    /**
     * Handle model selection
     * @param {string} model - Model name
     */
    function selectModel(model) {
        currentSelection.model = model;

        const data = serviceData[currentSelection.device];
        const brandData = data.brands.find(b => b.id === currentSelection.brand);

        document.getElementById('selectedDeviceInfo').textContent = `${brandData.name} ${model}`;

        const headerIcon = document.getElementById('repairHeaderIcon');
        headerIcon.className = `step-header-icon ${data.icon}`;
        headerIcon.innerHTML = deviceIconSvg[currentSelection.device];

        const repairGrid = document.getElementById('repairGrid');
        const activeRepairs = (data.repairs || []).filter(isActiveItem);
        repairGrid.innerHTML = activeRepairs.map(repair => `
            <div class="repair-card" data-repair="${repair.id}">
                <div class="repair-icon">${repairIcons[repair.icon] || repairIcons.other}</div>
                <h4>${repair.name}</h4>
                <p>${repair.desc}</p>
                <div class="repair-price">From ${formatCurrency(repair.price)}</div>
            </div>
        `).join('');

        repairGrid.querySelectorAll('.repair-card').forEach(card => {
            card.addEventListener('click', () => selectRepair(card.dataset.repair));
        });

        showStep(4);
        updateProgressSteps(4);
    }

    /**
     * Handle repair selection and add to cart via API
     * @param {string} repairId - Repair type ID
     */
    async function selectRepair(repairId) {
        const data = serviceData[currentSelection.device];
        const brandData = data.brands.find(b => b.id === currentSelection.brand);
        const repairData = data.repairs.find(r => r.id === repairId);

        try {
            // If user is not authenticated, add to a local cart instead of forcing login
            if (!Storage.getToken()) {
                const cartItem = {
                    id: Date.now(),
                    device: currentSelection.device,
                    brand: brandData.name,
                    model: currentSelection.model,
                    repairType: repairId,
                    repairName: repairData.name,
                    price: repairData.price
                };
                Storage.cart.push(cartItem);
                await Storage.saveCart();
                await updateCartCount();
                showToast(`${repairData.name} ${t('added to cart')}`);
                resetServiceSelection();
                return;
            }

            await apiCall('POST', '/cart', {
                device: currentSelection.device,
                deviceName: data.name,
                brand: currentSelection.brand,
                brandName: brandData.name,
                model: currentSelection.model,
                repairType: repairId,
                repairName: repairData.name,
                repairDesc: repairData.desc,
                price: repairData.price
            });

            await Storage.loadCart();
            await updateCartCount();
            showToast(`${repairData.name} ${t('added to cart')}`);
            resetServiceSelection();
        } catch (error) {
            console.error('Error adding to cart:', error);
            showToast(error.message || 'Failed to add to cart');
        }
    }

    // ========================================================================
    // MODULE 9: CART FUNCTIONS
    // Shopping cart management and display
    // ========================================================================

    /**
     * Update cart count badge in navigation
     */
    async function updateCartCount() {
        const countEls = DOM.cartCountEls;
        try {
            await Storage.loadCart();
            if (countEls?.length) {
                countEls.forEach((countEl) => {
                    countEl.textContent = Storage.cart.length;
                    countEl.setAttribute('data-count', Storage.cart.length);
                });
            }
        } catch (error) {
            console.error('Error updating cart count:', error);
        }
    }

    /**
     * Render and display the cart page from API data
     */
    async function renderCart() {
        const cartItemsEl = document.getElementById('cartItems');
        const cartSummaryEl = document.getElementById('cartSummary');

        try {
            await Storage.loadCart();

            if (Storage.cart.length === 0) {
                cartItemsEl.innerHTML = `
                    <div class="cart-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        <h3>${t('Your cart is empty')}</h3>
                        <p>${t('Add repair services to get started')}</p>
                        <a href="#" class="btn btn-primary" data-page="services">${t('Browse Services')}</a>
                    </div>
                `;
                cartSummaryEl.style.display = 'none';

                cartItemsEl.querySelector('[data-page]')?.addEventListener('click', (e) => {
                    e.preventDefault();
                    showPage('services');
                });
                return;
            }

            cartSummaryEl.style.display = 'block';

            let html = '';
            let total = 0;

            Storage.cart.forEach(item => {
                total += item.price;
                const customDetails = getCustomBuildDetails(item);
                const printingDetails = getPrintingDetails(item);
                const otherDetails = getOtherItemDetails(item);
                const metaLine = customDetails
                    ? `${t('Build Type')}: ${customDetails.buildType}${customDetails.partsSummary ? ' | ' + customDetails.partsSummary : ''}`
                    : printingDetails
                        ? `${t('Printer')}: ${printingDetails.printer || t('N/A')} | ${t('Filament')}: ${printingDetails.filament || t('N/A')} | ${t('Color')}: ${printingDetails.color || t('N/A')} | ${t('Strength')}: ${printingDetails.strength || t('N/A')} | ${t('Parts')}: ${printingDetails.parts || 1}${printingDetails.fileName ? ' | ' + t('File') + ': ' + printingDetails.fileName : ''}`
                        : otherDetails
                            ? `${t('Item')}: ${otherDetails.name || t('Other Item')}${otherDetails.desc ? ' | ' + otherDetails.desc : ''}`
                            : `${item.brand_name || item.brand || item.brandName || ''} ${item.model || ''}`;
                const label = item.repair_name || item.repair_type || item.repairName
                    || (printingDetails ? t('3D Printing') : (otherDetails ? t('Other Item') : t('Repair')));
                html += `
                    <div class="cart-item" data-id="${item.id}">
                        <div class="cart-item-icon">
                            ${repairIcons.other}
                        </div>
                        <div class="cart-item-info">
                            <h4>${label}</h4>
                            <p>${metaLine}</p>
                        </div>
                        <div class="cart-item-price">${formatCurrency(item.price)}</div>
                        <button class="cart-item-remove" data-id="${item.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                `;
            });

            cartItemsEl.innerHTML = html;

            document.getElementById('cartSubtotal').textContent = formatCurrency(total);
            document.getElementById('cartTotal').textContent = formatCurrency(total);

            cartItemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
                btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
            });
        } catch (error) {
            console.error('Error rendering cart:', error);
            showToast('Failed to load cart');
        }
    }

    /**
     * Remove item from cart via API
     * @param {number} id - Item ID to remove
     */
    async function removeFromCart(id) {
        try {
            if (!Storage.getToken()) {
                // Remove locally for unauthenticated users
                Storage.cart = (Storage.cart || []).filter(item => item.id !== id);
                await Storage.saveCart();
                await updateCartCount();
                await renderCart();
                showToast('Item removed from cart');
                return;
            }

            await apiCall('DELETE', `/cart/${id}`);
            await Storage.loadCart();
            updateCartCount();
            await renderCart();
            showToast('Item removed from cart');
        } catch (error) {
            console.error('Error removing from cart:', error);
            showToast('Failed to remove item from cart');
        }
    }

    // ========================================================================
    // MODULE 10: CHECKOUT & ORDERS FUNCTIONS
    // Checkout form, order creation, and management
    // ========================================================================

    /**
     * Render checkout page with items summary from API
     */
    async function renderCheckout() {
        const checkoutItemsEl = document.getElementById('checkoutItems');
        let total = 0;

        try {
            await Storage.loadCart();
            
            // Reset the checkout form
            const form = document.getElementById('checkoutForm');
            if (form) {
                form.reset();
                // Clear error messages
                document.querySelectorAll('[id$="Error"]').forEach(el => {
                    if (el.id.includes('Error')) el.textContent = '';
                });
                // Reset field error states
                form.querySelectorAll('input, textarea').forEach(field => {
                    field.classList.remove('error');
                });
                // Restore saved checkout values (if any) from localStorage
                try {
                    const fieldsToRestore = ['checkoutFirstName','checkoutLastName','checkoutEmail','checkoutPhone','checkoutAddress','checkoutCity','checkoutZip','checkoutNotes'];
                    fieldsToRestore.forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            const saved = localStorage.getItem(`checkout_${id}`);
                            if (saved) el.value = saved;
                        }
                    });

                    const savedCountryCode = localStorage.getItem('checkout_countryCode');
                    if (savedCountryCode) {
                        const cc = document.getElementById('countryCode');
                        if (cc) cc.value = savedCountryCode;
                    }

                    const savedCountry = localStorage.getItem('checkout_checkoutCountry');
                    if (savedCountry) {
                        const csel = document.getElementById('checkoutCountry');
                        if (csel) csel.value = savedCountry;
                    }

                    const savedService = localStorage.getItem('checkout_serviceType');
                    if (savedService) {
                        const radio = document.querySelector(`input[name="serviceType"][value="${savedService}"]`);
                        if (radio) radio.checked = true;
                    }

                    const savedTerms = localStorage.getItem('checkout_termsCheckbox');
                    if (savedTerms !== null) {
                        const terms = document.getElementById('termsCheckbox');
                        if (terms) terms.checked = savedTerms === 'true';
                    }
                } catch {
                    // ignore restore errors
                }
            }

            try {
                const savedPacketa = localStorage.getItem('checkout_packeta_point');
                if (savedPacketa) {
                    const parsed = JSON.parse(savedPacketa);
                    if (parsed && typeof parsed === 'object') {
                        packetaSelection = parsed;
                    }
                }
            } catch {
                // ignore restore errors
            }

            updatePacketaUi();
            updateCheckoutPickupFeeUi();
            updateCheckoutPaymentMethodsUi();

            const serviceType = document.querySelector('input[name="serviceType"]:checked')?.value || 'delivery';
            const addressSection = document.getElementById('addressSection');
            const packetaSection = document.getElementById('packetaSection');
            if (serviceType === 'pickup') {
                if (addressSection) addressSection.style.display = 'block';
                if (packetaSection) packetaSection.style.display = 'none';
            } else if (serviceType === 'zasilkovna') {
                if (addressSection) addressSection.style.display = 'none';
                if (packetaSection) packetaSection.style.display = 'block';
            } else {
                if (addressSection) addressSection.style.display = 'none';
                if (packetaSection) packetaSection.style.display = 'none';
            }
            
            let html = '';
            Storage.cart.forEach(item => {
                total += item.price;
                const printingDetails = getPrintingDetails(item);
                const otherDetails = getOtherItemDetails(item);
                const label = item.repair_name || item.repair_type || item.repairName
                    || (item.device === 'custompc' ? t('Custom PC Build') : (printingDetails ? t('3D Printing') : (otherDetails ? t('Other Item') : t('Repair'))));
                const customDetails = getCustomBuildDetails(item);
                const printingLine = printingDetails
                    ? `${t('Printer')}: ${printingDetails.printer || t('N/A')} | ${t('Filament')}: ${printingDetails.filament || t('N/A')} | ${t('Color')}: ${printingDetails.color || t('N/A')} | ${t('Strength')}: ${printingDetails.strength || t('N/A')} | ${t('Parts')}: ${printingDetails.parts || 1}${printingDetails.fileName ? ' | ' + t('File') + ': ' + printingDetails.fileName : ''}`
                    : '';
                const metaLine = customDetails
                    ? `${t('Build Type')}: ${customDetails.buildType}${customDetails.partsSummary ? ' | ' + customDetails.partsSummary : ''}`
                    : (printingLine || (otherDetails ? `${t('Item')}: ${otherDetails.name || t('Other Item')}${otherDetails.desc ? ' | ' + otherDetails.desc : ''}` : `${item.brand_name || item.brand || item.brandName || ''} ${item.model || ''}`));
                html += `
                    <div class="checkout-item">
                        <div class="checkout-item-info">
                            <h4>${label}</h4>
                            <p>${metaLine}</p>
                        </div>
                        <div class="checkout-item-price">${formatCurrency(item.price)}</div>
                    </div>
                `;
            });

            if (checkoutItemsEl) checkoutItemsEl.innerHTML = html;
            const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
            const checkoutTotalEl = document.getElementById('checkoutTotal');
            if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatCurrency(total);
            if (checkoutTotalEl) checkoutTotalEl.textContent = formatCurrency(total);
            updateCheckoutPickupFeeUi();
            updateCheckoutTotals(total);
        } catch (error) {
            console.error('Error rendering checkout:', error);
            showToast('Failed to load checkout');
        }
    }

    async function trackOrderLookup(orderNumber, email, options = {}) {
        if (!DOM.trackResult) return;
        const trimmedOrder = normalizeOrderNumber(orderNumber || '');
        const trimmedEmail = (email || '').trim();

        if (!trimmedOrder || !trimmedEmail) {
            DOM.trackResult.innerHTML = `
                <div class="track-empty">
                    <h3>${t('Missing details')}</h3>
                    <p>${t('Please enter both your order number and email address.')}</p>
                </div>
            `;
            return;
        }

        DOM.trackResult.innerHTML = `<div class="loader">${t('Loading...')}</div>`;

        try {
            const result = await apiCall('POST', '/orders/track', {
                orderNumber: trimmedOrder,
                email: trimmedEmail
            });

            const order = result.order || {};
            const items = order.items || [];
            const statusRaw = (order.status || 'pending').toLowerCase();
            const statusClass = statusRaw.replace(/[^a-z-]/g, '');
            const statusLabel = formatStatusLabel(statusRaw);
            const createdAt = order.created_at ? new Date(order.created_at).toLocaleString() : t('N/A');
            const updatedAt = order.updated_at ? new Date(order.updated_at).toLocaleString() : null;
            const total = order.total || 0;
            let packetaPointLine = '';
            if (order.packeta_point_json) {
                try {
                    const point = JSON.parse(order.packeta_point_json);
                    if (point && point.name) {
                        const addressParts = [point.street, point.city, point.zip].filter(Boolean).join(', ');
                        const text = addressParts ? `${point.name} - ${addressParts}` : point.name;
                        packetaPointLine = ` • ${t('Pickup point')}: ${escapeHtml(text)}`;
                    }
                } catch {
                    // ignore parse errors
                }
            }

            const itemsHtml = items.length > 0 ? items.map(item => {
                const customDetails = getCustomBuildDetails(item);
                const printingDetails = getPrintingDetails(item);
                const otherDetails = getOtherItemDetails(item);
                const itemTitle = escapeHtml(item.repair_name || item.repair_type || t('Repair'));
                const detailLine = customDetails
                    ? `${t('Build Type')}: ${escapeHtml(customDetails.buildType)}${customDetails.partsSummary ? ' | ' + escapeHtml(customDetails.partsSummary) : ''}`
                    : printingDetails
                        ? `${t('Printer')}: ${escapeHtml(printingDetails.printer || t('N/A'))} | ${t('Filament')}: ${escapeHtml(printingDetails.filament || t('N/A'))} | ${t('Color')}: ${escapeHtml(printingDetails.color || t('N/A'))} | ${t('Strength')}: ${escapeHtml(printingDetails.strength || t('N/A'))} | ${t('Parts')}: ${escapeHtml(String(printingDetails.parts || 1))}${printingDetails.fileName ? ' | ' + t('File') + ': ' + escapeHtml(printingDetails.fileName) : ''}`
                        : otherDetails
                            ? `${t('Item')}: ${escapeHtml(otherDetails.name || t('Other Item'))}${otherDetails.desc ? ' | ' + t('Details') + ': ' + escapeHtml(otherDetails.desc) : ''}`
                            : `${escapeHtml(item.brand || t('N/A'))} ${escapeHtml(item.model || '')}`;
                const priceValue = (item.price || 0);
                const price = formatCurrency(priceValue);

                return `
                    <div class="track-item">
                        <div>
                            <h4>${itemTitle}</h4>
                            <p>${detailLine}</p>
                        </div>
                        <div><strong>${price}</strong></div>
                    </div>
                `;
            }).join('') : `<p class="track-meta">${t('No items found for this order.')}</p>`;

            DOM.trackResult.innerHTML = `
                <div class="track-summary">
                    <div>
                        <h2>${escapeHtml(order.order_number || trimmedOrder)}</h2>
                        <div class="track-meta">${t('Placed')} ${createdAt}${updatedAt ? ` • ${t('Updated')} ${updatedAt}` : ''}</div>
                    </div>
                    <span class="order-status ${statusClass}">
                        <span class="order-status-dot"></span>
                        ${statusLabel}
                    </span>
                </div>
                <div class="track-meta">${t('Service Type')}: ${escapeHtml(formatServiceTypeLabel(order.service_type))} • ${t('Total')}: ${formatCurrency(total)}${packetaPointLine}</div>
                <div class="track-items">
                    ${itemsHtml}
                </div>
            `;
        } catch (error) {
            const message = t(error.message || 'Unable to find that order.');
            DOM.trackResult.innerHTML = `
                <div class="track-empty">
                    <h3>${t('Order not found')}</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
            if (!options.auto) {
                showToast(message);
            }
        }
    }

    function handleTrackFormSubmit(event) {
        event.preventDefault();
        const orderNumber = DOM.trackOrderNumber ? DOM.trackOrderNumber.value : '';
        const email = DOM.trackEmail ? DOM.trackEmail.value : '';
        trackOrderLookup(orderNumber, email);
    }

    /**
     * Validate email address format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        return emailRegex.test(String(email || '').trim());
    }

    /**
     * Validate phone number format
     * @param {string} phone - Phone to validate
     * @returns {boolean} True if valid phone
     */
    function validatePhone(phone) {
        // Allow spaces (or other common separators) but they are optional.
        // Validate based on digit count after stripping non-digits (typical phone lengths).
        const allowed = /^[\d\s\-\(\)\+]+$/;
        if (!allowed.test(phone)) return false;
        const digits = phone.replace(/\D/g, '');
        // Accept typical phone lengths (min 6, max 15 digits).
        return digits.length >= 6 && digits.length <= 15;
    }

    /**
     * Set error state on form field
     * @param {string} fieldId - Field element ID
     * @param {string} errorId - Error message element ID
     * @param {string} message - Error message to display
     */
    function setFieldError(fieldId, errorId, message) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(errorId);
        if (field) {
            field.classList.add('error');
        }
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    /**
     * Clear error state on form field
     * @param {string} fieldId - Field element ID
     * @param {string} errorId - Error message element ID
     */
    function clearFieldError(fieldId, errorId) {
        const field = document.getElementById(fieldId);
        const errorEl = document.getElementById(errorId);
        if (field) {
            field.classList.remove('error');
        }
        if (errorEl) {
            errorEl.textContent = '';
        }
    }

    /**
     * Validate entire checkout form
     * @returns {boolean} True if form is valid
     */
    function validateCheckoutForm() {
        let isValid = true;

        const firstName = document.getElementById('checkoutFirstName').value.trim();
        const lastName = document.getElementById('checkoutLastName').value.trim();
        const email = document.getElementById('checkoutEmail').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const serviceType = document.querySelector('input[name="serviceType"]:checked').value;
        const country = document.getElementById('checkoutCountry').value.trim();
        const termsCheckbox = document.getElementById('termsCheckbox').checked;

        // Validate First Name
        if (!firstName) {
            setFieldError('checkoutFirstName', 'firstNameError', 'First name is required');
            isValid = false;
        } else if (firstName.length < 2) {
            setFieldError('checkoutFirstName', 'firstNameError', 'First name must be at least 2 characters');
            isValid = false;
        } else {
            clearFieldError('checkoutFirstName', 'firstNameError');
        }

        // Validate Last Name
        if (!lastName) {
            setFieldError('checkoutLastName', 'lastNameError', 'Last name is required');
            isValid = false;
        } else if (lastName.length < 2) {
            setFieldError('checkoutLastName', 'lastNameError', 'Last name must be at least 2 characters');
            isValid = false;
        } else {
            clearFieldError('checkoutLastName', 'lastNameError');
        }

        // Validate Email
        if (!email) {
            setFieldError('checkoutEmail', 'emailError', 'Email address is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            setFieldError('checkoutEmail', 'emailError', 'Please enter a valid email address');
            isValid = false;
        } else {
            clearFieldError('checkoutEmail', 'emailError');
        }

        // Validate Phone
        if (!phone) {
            setFieldError('checkoutPhone', 'phoneError', 'Phone number is required');
            isValid = false;
        } else if (!validatePhone(phone)) {
            setFieldError('checkoutPhone', 'phoneError', 'Please enter a valid phone number');
            isValid = false;
        } else {
            clearFieldError('checkoutPhone', 'phoneError');
        }

        // Validate Address if pickup is selected
        if (serviceType === 'pickup') {
            const address = document.getElementById('checkoutAddress').value.trim();
            const city = document.getElementById('checkoutCity').value.trim();
            const zip = document.getElementById('checkoutZip').value.trim();

            if (!address) {
                setFieldError('checkoutAddress', 'addressError', 'Street address is required');
                isValid = false;
            } else {
                clearFieldError('checkoutAddress', 'addressError');
            }

            if (!city) {
                setFieldError('checkoutCity', 'cityError', 'City is required');
                isValid = false;
            } else {
                clearFieldError('checkoutCity', 'cityError');
            }

            if (!zip) {
                setFieldError('checkoutZip', 'zipError', 'ZIP code is required');
                isValid = false;
            } else if (!/^\d{5}(-\d{4})?$/.test(zip)) {
                setFieldError('checkoutZip', 'zipError', 'Please enter a valid ZIP code');
                isValid = false;
            } else {
                clearFieldError('checkoutZip', 'zipError');
            }
        } else if (['ceska-posta', 'ppl', 'dpd', 'gls'].includes(serviceType)) {
            // Also require address for other delivery methods
            const address = document.getElementById('checkoutAddress').value.trim();
            const city = document.getElementById('checkoutCity').value.trim();
            const zip = document.getElementById('checkoutZip').value.trim();

            if (!address) {
                setFieldError('checkoutAddress', 'addressError', 'Street address is required');
                isValid = false;
            } else {
                clearFieldError('checkoutAddress', 'addressError');
            }

            if (!city) {
                setFieldError('checkoutCity', 'cityError', 'City is required');
                isValid = false;
            } else {
                clearFieldError('checkoutCity', 'cityError');
            }

            if (!zip) {
                setFieldError('checkoutZip', 'zipError', 'ZIP code is required');
                isValid = false;
            } else if (!/^\d{5}(-\d{4})?$/.test(zip)) {
                setFieldError('checkoutZip', 'zipError', 'Please enter a valid ZIP code');
                isValid = false;
            } else {
                clearFieldError('checkoutZip', 'zipError');
            }
        } else {
            clearFieldError('checkoutAddress', 'addressError');
            clearFieldError('checkoutCity', 'cityError');
            clearFieldError('checkoutZip', 'zipError');
        }

        const packetaError = document.getElementById('packetaError');
        if (serviceType === 'zasilkovna') {
            if (!packetaSelection) {
                if (packetaError) packetaError.textContent = t('Pickup point required');
                isValid = false;
            } else if (packetaError) {
                packetaError.textContent = '';
            }
        } else if (packetaError) {
            packetaError.textContent = '';
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        const paymentMethodError = document.getElementById('paymentMethodError');
        if (!paymentMethod) {
            if (paymentMethodError) paymentMethodError.textContent = 'Payment method is required';
            isValid = false;
        } else if (paymentMethodError) {
            paymentMethodError.textContent = '';
        }

        // Validate Country
        if (!country) {
            setFieldError('checkoutCountry', 'countryError', 'Country is required');
            isValid = false;
        } else {
            clearFieldError('checkoutCountry', 'countryError');
        }

        // Validate Terms and Conditions
        if (!termsCheckbox) {
            setFieldError('termsCheckbox', 'termsError', 'You must agree to the terms and conditions');
            isValid = false;
        } else {
            clearFieldError('termsCheckbox', 'termsError');
        }

        return isValid;
    }

    /**
     * Render admin orders page with filtering and statistics
     */
    async function renderAdminOrders() {
        try {
            await refreshActiveVisitorsStat();
            // Fetch all orders from API (admin view)
            const result = await apiCall('GET', '/orders');
            const orders = result.orders || [];

            const ordersList = DOM.ordersList;
            if (!ordersList) return;

            const statusFilter = DOM.statusFilter?.value || 'all';
            const orderTypeFilter = DOM.orderTypeFilter?.value || 'all';
            const deviceFilter = window.currentDeviceFilter || 'all';
            const customBuildFilter = window.currentCustomPcFilter || 'all';
            const customOrdersList = document.getElementById('customPcOrdersList');
            const printingOrdersList = document.getElementById('printingOrdersList');
            const otherItemsOrdersList = document.getElementById('otherItemsOrdersList');
            const usedShopOrdersList = document.getElementById('usedShopOrdersList');

            // Update stats
            const totalCount = orders.length;
            const pendingCount = orders.filter(o => o.status === 'pending').length;
            const inProgressCount = orders.filter(o => ['in-progress', 'waiting', 'delivering'].includes(o.status)).length;
            const completedCount = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length;

            const totalOrdersEl = document.getElementById('totalOrders');
            const pendingOrdersEl = document.getElementById('pendingOrders');
            const inProgressOrdersEl = document.getElementById('inProgressOrders');
            const completedOrdersEl = document.getElementById('completedOrders');

            if (totalOrdersEl) totalOrdersEl.textContent = totalCount;
            if (pendingOrdersEl) pendingOrdersEl.textContent = pendingCount;
            if (inProgressOrdersEl) inProgressOrdersEl.textContent = inProgressCount;
            if (completedOrdersEl) completedOrdersEl.textContent = completedCount;

            // Filter orders
            let filteredOrders = orders;
            
            // Filter by status
            if (statusFilter !== 'all') {
                filteredOrders = filteredOrders.filter(o => o.status === statusFilter);
            }

            if (window.adminEmailFilter) {
                filteredOrders = filteredOrders.filter(o =>
                    (o.customer_email || '').toLowerCase().includes(window.adminEmailFilter)
                );
            }

            // Sort by date (newest first)
            filteredOrders = filteredOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            const orderDetails = [];
            for (const order of filteredOrders) {
                let items = [];
                let detail = {};
                try {
                    const orderDetail = await apiCall('GET', `/orders/${order.id}`);
                    detail = orderDetail.order || {};
                    items = detail.items || [];
                } catch (e) {
                    console.log('Could not fetch order details:', e);
                }
                orderDetails.push({ order, detail, items });
            }

            const isCustomItem = (item) => (item.device || '').toLowerCase() === 'custompc';
            const isPrintingItem = (item) => {
                const device = (item.device || '').toLowerCase();
                return device === 'printing' || device === '3d-printing';
            };
            const isOtherItem = (item) => {
                const device = (item.device || '').toLowerCase();
                return device === 'other' || device === 'other-item';
            };
            const isUsedShopItem = (item) => {
                if (!isOtherItem(item)) return false;
                const repairType = String(item.repair_type || item.repairType || '').toLowerCase();
                return repairType === 'used-device' || repairType === 'used-shop';
            };
            const resolveBuildType = (item) => {
                const details = getCustomBuildDetails(item);
                const type = (details?.buildType || '').toLowerCase();
                if (!type) return 'pc';
                return type.includes('server') ? 'server' : 'pc';
            };
            const isRepairItem = (item) => !isCustomItem(item) && !isPrintingItem(item);
            const isGeneralRepairItem = (item) => !isCustomItem(item) && !isPrintingItem(item) && !isOtherItem(item);
            const isRegularOtherItem = (item) => isOtherItem(item) && !isUsedShopItem(item);

            const passesTypeFilter = (entry) => {
                if (orderTypeFilter === 'all') return true;
                const items = Array.isArray(entry?.items) ? entry.items : [];
                if (orderTypeFilter === 'repairs') return items.some(isGeneralRepairItem) || items.length === 0;
                if (orderTypeFilter === 'custom-pc') return items.some(isCustomItem);
                if (orderTypeFilter === 'printing') return items.some(isPrintingItem);
                if (orderTypeFilter === 'other-items') return items.some(isRegularOtherItem);
                if (orderTypeFilter === 'used-shop') return items.some(isUsedShopItem);
                return true;
            };

            const typeFilteredOrderDetails = orderDetails.filter(passesTypeFilter);

            const repairsEntries = typeFilteredOrderDetails.filter(entry => {
                const repairItems = entry.items.filter(item => isGeneralRepairItem(item));
                if (deviceFilter === 'all') return repairItems.length > 0 || entry.items.length === 0;
                return repairItems.some(item => {
                    const itemDevice = (item.device || '').toLowerCase();
                    return itemDevice === deviceFilter || itemDevice.includes(deviceFilter);
                });
            });

            const customEntries = typeFilteredOrderDetails.filter(entry => {
                const customItems = entry.items.filter(isCustomItem);
                if (customItems.length === 0) return false;
                if (customBuildFilter === 'all') return true;
                return customItems.some(item => resolveBuildType(item) === customBuildFilter);
            });

            const printingEntries = typeFilteredOrderDetails.filter(entry => {
                const printingItems = entry.items.filter(isPrintingItem);
                return printingItems.length > 0;
            });

            const otherEntries = typeFilteredOrderDetails.filter(entry => {
                const otherItems = entry.items.filter(isRegularOtherItem);
                return otherItems.length > 0;
            });

            const usedEntries = typeFilteredOrderDetails.filter(entry => {
                const usedItems = entry.items.filter(isUsedShopItem);
                return usedItems.length > 0;
            });

            const mapEntries = (entries, filterFn) => entries.map(entry => {
                const items = filterFn ? entry.items.filter(filterFn) : entry.items;
                return { order: entry.order, detail: entry.detail, items };
            });

            const buildOrdersHtml = (entries) => {
                let html = '';
                for (const entry of entries) {
                    const order = entry.order;
                    const detail = entry.detail || {};
                    const items = entry.items || [];

                const itemsList = items.map(item => {
                    const customDetails = getCustomBuildDetails(item);
                    const printingDetails = getPrintingDetails(item);
                    const otherDetails = getOtherItemDetails(item);
                    const fileUrl = resolveFileUrl(printingDetails?.fileName || item.file_name || item.fileName);
                    const detailsLine = customDetails
                        ? `<p><strong>${t('Build Type')}:</strong> ${escapeHtml(customDetails.buildType)}${customDetails.partsSummary ? ' | <strong>' + t('Parts') + ':</strong> ' + escapeHtml(customDetails.partsSummary) : ''}</p>`
                        : printingDetails
                            ? `<p><strong>${t('Printer')}:</strong> ${escapeHtml(printingDetails.printer || t('N/A'))} | <strong>${t('Filament')}:</strong> ${escapeHtml(printingDetails.filament || t('N/A'))} | <strong>${t('Color')}:</strong> ${escapeHtml(printingDetails.color || t('N/A'))} | <strong>${t('Strength')}:</strong> ${escapeHtml(printingDetails.strength || t('N/A'))} | <strong>${t('Parts')}:</strong> ${escapeHtml(String(printingDetails.parts || 1))}${printingDetails.fileName ? ' | <strong>' + t('File') + ':</strong> ' + escapeHtml(printingDetails.fileName) : ''}</p>${fileUrl ? `<a class="order-file-link" href="${fileUrl}" download>${t('Download file')}</a>` : ''}`
                            : otherDetails
                                ? `<p><strong>${t('Item')}:</strong> ${escapeHtml(otherDetails.name || t('Other Item'))}${otherDetails.desc ? ' | <strong>' + t('Details') + ':</strong> ' + escapeHtml(otherDetails.desc) : ''}</p>`
                                : `<p><strong>${t('Brand')}:</strong> ${escapeHtml(item.brand || t('N/A'))} | <strong>${t('Model')}:</strong> ${escapeHtml(item.model || t('N/A'))} | <strong>${t('Device')}:</strong> ${escapeHtml(item.device || t('N/A'))}</p>`;
                    return `
                    <div class="order-item-row">
                        <div class="order-item-details">
                            <h5>${escapeHtml(item.repair_name || item.repair_type || t('Repair'))}</h5>
                            ${detailsLine}
                        </div>
                        <div class="order-item-price">${formatCurrency(item.price || 0)}</div>
                    </div>
                `;
                }).join('');

                const itemsSection = items.length > 0 ? `
                    <div class="order-items">
                        <h4>${t('Repairs')} (${items.length})</h4>
                        ${itemsList}
                    </div>
                ` : `<div class="order-items"><h4>${t('Repairs')}</h4><p style="color: #999;">${t('No items')}</p></div>`;

                const displayAddress = escapeHtml(detail.customer_address || order.customer_address || t('N/A'));
                const displayService = escapeHtml(formatServiceTypeLabel(detail.service_type || order.service_type || t('N/A')));
                const displayNotes = escapeHtml(detail.notes || order.notes || '');
                const displayTotal = (detail.total || order.total || 0);

                    html += `
                    <div class="order-card">
                        <div class="order-card-header">
                            <div>
                                <div class="order-id">${escapeHtml(order.order_number)}</div>
                                <div class="order-date">${new Date(order.created_at).toLocaleDateString()} ${t('at')} ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <span class="order-status ${order.status}">
                                    <span class="order-status-dot"></span>
                                    ${formatStatusLabel(order.status)}
                                </span>
                                <button class="btn btn-sm" data-order-action="details" data-order-id="${order.id}">${t('Details')}</button>
                            </div>
                        </div>
                        <div class="order-card-body">
                            <div class="order-info-grid">
                                <div class="order-info-item">
                                    <span class="order-info-label">${t('Customer')}</span>
                                    <span class="order-info-value">${escapeHtml(detail.customer_name || order.customer_name || t('Customer'))}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">${t('Email')}</span>
                                    <span class="order-info-value">${escapeHtml(detail.customer_email || order.customer_email || t('N/A'))}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">${t('Phone')}</span>
                                    <span class="order-info-value">${escapeHtml(normalizePhoneForDisplay(detail.customer_phone || order.customer_phone || '') || t('N/A'))}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">${t('Address')}</span>
                                    <span class="order-info-value">${displayAddress}</span>
                                </div>
                                <div class="order-info-item">
                                    <span class="order-info-label">${t('Service')}</span>
                                    <span class="order-info-value">${displayService}</span>
                                </div>
                            </div>

                            ${itemsSection}

                            ${displayNotes ? `<div style="margin-top:12px;"><strong>${t('Notes')}:</strong><p style="margin:6px 0;color:#333;">${displayNotes}</p></div>` : ''}

                        </div>
                        <div class="order-card-footer">
                            <div class="order-total">${t('Total')}: <strong>${formatCurrency(displayTotal)}</strong></div>
                            <div class="order-actions">
                                <button class="order-action-btn primary" data-order-action="edit-status" data-order-id="${order.id}">${t('Edit Status')}</button>
                                <button class="order-action-btn info" data-order-action="email" data-order-id="${order.id}" data-order-email="${escapeHtml(order.customer_email || '')}" data-order-name="${escapeHtml(order.customer_name || '')}">${t('Email')}</button>
                                <button class="order-action-btn" data-order-action="invoice" data-order-id="${order.id}">Invoice</button>
                                <button class="order-action-btn danger" data-order-action="delete" data-order-id="${order.id}">${t('Delete')}</button>
                            </div>
                        </div>
                    </div>
                    `;
                }
                return html;
            };

            if (ordersList) {
                if (repairsEntries.length === 0) {
                    const statusLabel = statusFilter === 'all' ? '' : formatStatusLabel(statusFilter);
                    ordersList.innerHTML = `
                        <div class="no-orders" id="noOrders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            <h3>${t('No orders')}</h3>
                            <p>${statusFilter === 'all' ? t('No orders yet') : `${t('No')} ${statusLabel} ${t('orders')}`}</p>
                        </div>
                    `;
                } else {
                    ordersList.innerHTML = buildOrdersHtml(mapEntries(repairsEntries, item => isGeneralRepairItem(item)));
                }
            }

            if (customOrdersList) {
                if (customEntries.length === 0) {
                    customOrdersList.innerHTML = `
                        <div class="no-orders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                                <line x1="12" y1="17" x2="12" y2="21"></line>
                            </svg>
                            <h3>${t('No custom PC orders yet')}</h3>
                            <p>${statusFilter === 'all' ? t('No custom PC orders yet') : `${t('No')} ${formatStatusLabel(statusFilter)} ${t('custom PC orders')}`}</p>
                        </div>
                    `;
                } else {
                    customOrdersList.innerHTML = buildOrdersHtml(mapEntries(customEntries, isCustomItem));
                }
            }

            if (printingOrdersList) {
                if (printingEntries.length === 0) {
                    printingOrdersList.innerHTML = `
                        <div class="no-orders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="18" height="10" rx="2"></rect>
                                <rect x="6" y="13" width="12" height="6" rx="2"></rect>
                                <line x1="8" y1="21" x2="16" y2="21"></line>
                            </svg>
                            <h3>${t('No 3D printing orders yet')}</h3>
                            <p>${statusFilter === 'all' ? t('No 3D printing orders yet') : `${t('No')} ${formatStatusLabel(statusFilter)} ${t('3D printing orders')}`}</p>
                        </div>
                    `;
                } else {
                    printingOrdersList.innerHTML = buildOrdersHtml(mapEntries(printingEntries, isPrintingItem));
                }
            }

            if (otherItemsOrdersList) {
                if (otherEntries.length === 0) {
                    otherItemsOrdersList.innerHTML = `
                        <div class="no-orders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 7h-4V3H8v4H4v14h16V7z"></path>
                                <path d="M8 7h8"></path>
                            </svg>
                            <h3>${t('No other item orders yet')}</h3>
                            <p>${statusFilter === 'all' ? t('No other item orders yet') : `${t('No')} ${formatStatusLabel(statusFilter)} ${t('other item orders')}`}</p>
                        </div>
                    `;
                } else {
                    otherItemsOrdersList.innerHTML = buildOrdersHtml(mapEntries(otherEntries, isRegularOtherItem));
                }
            }

            if (usedShopOrdersList) {
                if (usedEntries.length === 0) {
                    usedShopOrdersList.innerHTML = `
                        <div class="no-orders">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="14" rx="2"></rect>
                                <path d="M3 10h18"></path>
                                <path d="M8 20h8"></path>
                            </svg>
                            <h3>${t('No used shop orders yet')}</h3>
                            <p>${statusFilter === 'all' ? t('No used shop orders yet') : `${t('No')} ${formatStatusLabel(statusFilter)} ${t('used shop orders')}`}</p>
                        </div>
                    `;
                } else {
                    usedShopOrdersList.innerHTML = buildOrdersHtml(mapEntries(usedEntries, isUsedShopItem));
                }
            }

            applyTranslations();

            // Order Details modal helper functions
            window.showOrderDetails = async function(orderId) {
                const modal = document.getElementById('orderDetailsModal');
                const content = document.getElementById('orderDetailsContent');
                if (!modal || !content) return;
                content.innerHTML = `<div class="loader">${t('Loading...')}</div>`;
                modal.classList.remove('hidden'); modal.style.display = '';
                try {
                    const res = await apiCall('GET', `/orders/${orderId}`);
                    const o = res.order || {};
                    const items = o.items || [];
                    let itemsHtml = '';
                    items.forEach(item => {
                        const customDetails = getCustomBuildDetails(item);
                        const printingDetails = getPrintingDetails(item);
                        const otherDetails = getOtherItemDetails(item);
                        const fileUrl = resolveFileUrl(printingDetails?.fileName || item.file_name || item.fileName);
                        const line = customDetails
                            ? `${t('Build Type')}: ${escapeHtml(customDetails.buildType)}${customDetails.partsSummary ? ' | ' + t('Parts') + ': ' + escapeHtml(customDetails.partsSummary) : ''}`
                            : printingDetails
                                ? `${t('Printer')}: ${escapeHtml(printingDetails.printer || t('N/A'))} | ${t('Filament')}: ${escapeHtml(printingDetails.filament || t('N/A'))} | ${t('Color')}: ${escapeHtml(printingDetails.color || t('N/A'))} | ${t('Strength')}: ${escapeHtml(printingDetails.strength || t('N/A'))} | ${t('Parts')}: ${escapeHtml(String(printingDetails.parts || 1))}${printingDetails.fileName ? ' | ' + t('File') + ': ' + escapeHtml(printingDetails.fileName) : ''}`
                                : otherDetails
                                    ? `${t('Item')}: ${escapeHtml(otherDetails.name || t('Other Item'))}${otherDetails.desc ? ' | ' + t('Details') + ': ' + escapeHtml(otherDetails.desc) : ''}`
                                    : `${escapeHtml(item.brand || t('N/A'))} ${escapeHtml(item.model || '')}`;
                        itemsHtml += `<div class="order-item-row"><div><strong>${escapeHtml(item.repair_name || item.repair_type || t('Repair'))}</strong><div style="color:#666;font-size:0.9rem;">${line}</div>${fileUrl ? `<a class="order-file-link" href="${fileUrl}" download>${t('Download file')}</a>` : ''}</div><div style="font-weight:700;">$${(item.price || 0).toFixed ? item.price.toFixed(2) : item.price || '0'}</div></div>`;
                    });

                    const address = escapeHtml(o.customer_address || t('N/A'));
                    const city = escapeHtml(o.customer_city || '');
                    const zip = escapeHtml(o.customer_zip || '');
                    const country = escapeHtml(o.country || t('Czech Republic'));
                    const notes = escapeHtml(o.notes || '');

                    let packetaPointHtml = '';
                    if (o.packeta_point_json) {
                        try {
                            const point = JSON.parse(o.packeta_point_json);
                            if (point && point.name) {
                                const addressParts = [point.street, point.city, point.zip].filter(Boolean).join(', ');
                                const text = addressParts ? `${point.name} - ${addressParts}` : point.name;
                                packetaPointHtml = `<div style="margin-top:12px;"><strong>${t('Pickup point')}</strong><div style="color:#333;margin-top:6px;word-break:break-word;white-space:pre-wrap;">${escapeHtml(text)}</div></div>`;
                            }
                        } catch {
                            // ignore parse errors
                        }
                    }

                    content.innerHTML = `
                        <div class="order-details-grid">
                            <div>
                                <div class="label">${t('Order')}</div>
                                <div class="value">${escapeHtml(o.order_number || '')}</div>
                            </div>
                            <div>
                                <div class="label">${t('Date')}</div>
                                <div class="value">${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</div>
                            </div>
                            <div>
                                <div class="label">${t('Customer')}</div>
                                <div class="value">${escapeHtml(o.customer_name || '')}</div>
                            </div>
                            <div>
                                <div class="label">${t('Email')}</div>
                                <div class="value">${escapeHtml(o.customer_email || '')}</div>
                            </div>
                            <div>
                                <div class="label">${t('Phone')}</div>
                                <div class="value">${escapeHtml(normalizePhoneForDisplay(o.customer_phone || ''))}</div>
                            </div>
                            <div>
                                <div class="label">${t('Service')}</div>
                                <div class="value">${escapeHtml(formatServiceTypeLabel(o.service_type || ''))}</div>
                            </div>
                            <div>
                                <div class="label">${t('Country')}</div>
                                <div class="value">${country}</div>
                            </div>
                        </div>
                        <div style="margin-top:12px;"><strong>${t('Full Address')}</strong><div style="color:#333;margin-top:6px;word-break:break-word;white-space:pre-wrap;">${address}${city ? ', ' + city : ''}${zip ? ' ' + zip : ''}</div></div>
                        ${packetaPointHtml}
                        <div class="order-details-items" style="margin-top:12px;">
                            <h4>${t('Items')} (${items.length})</h4>
                            ${itemsHtml}
                        </div>
                        ${notes ? `<div style="margin-top:12px;"><strong>${t('Notes')}</strong><div style="color:#333;margin-top:6px;">${notes}</div></div>` : ''}
                        <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                            <div><strong>${t('Total')}:</strong> ${formatCurrency(o.total || 0)}</div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <button class="btn btn-primary" onclick="editOrderStatus(${orderId})">${t('Edit Status')}</button>
                                <button class="btn btn-secondary" onclick="emailCustomer(${orderId}, '${o.customer_email || ''}', '${(o.customer_name || '').replace(/'/g, "\\'") }')">${t('Email')}</button>
                                <button class="btn btn-secondary" onclick="printInvoiceForOrder(${orderId})">Invoice</button>
                                <button class="btn btn-info" onclick="printOrderDetails(${orderId})">${t('Print')}</button>
                                <button class="btn btn-danger" onclick="deleteOrder(${orderId})">${t('Delete')}</button>
                            </div>
                        </div>
                    `;
                } catch {
                    content.innerHTML = `<div class="form-message">${t('Failed to load order details')}</div>`;
                }
            };

            window.closeOrderDetails = function() {
                const modal = document.getElementById('orderDetailsModal');
                if (!modal) return;
                modal.classList.add('hidden'); modal.style.display = 'none';
            };
        } catch (error) {
            showToast('Failed to load orders: ' + error.message);
        }
    }

    function renderCatalogEditor() {
        ensureCatalogState();
        setDefaultCatalogUiState();
        renderCatalogTabs();

        const activeTabBtn = document.querySelector('.catalog-tab-btn.active');
        const activeTab = activeTabBtn?.dataset.catalogTab || 'repairs';
        renderCatalogTabContent(activeTab);

        renderCatalogAnnouncement();
        applyTranslations();
    }

    function renderCatalogAnnouncement() {
        const toggle = document.getElementById('catalogAnnouncementToggle');
        const text = document.getElementById('catalogAnnouncementText');
        if (!toggle || !text) return;

        const announcement = catalogDraft.announcement || { active: false, text: '' };
        toggle.checked = !!announcement.active;
        text.value = announcement.text || '';

        toggle.onchange = () => {
            announcement.active = toggle.checked;
            catalogDraft.announcement = announcement;
        };
        text.oninput = () => {
            announcement.text = text.value;
            catalogDraft.announcement = announcement;
        };
    }

    // ========================================================================
    // MODULE 10B: EMAIL FUNCTIONS
    // Send emails to customers
    // ========================================================================

    // Functions moved outside DOMContentLoaded for onclick attribute access

    function formatInvoiceAmount(value) {
        const amount = Number(value || 0);
        const safeAmount = Number.isFinite(amount) ? amount : 0;
        return `${safeAmount.toFixed(2)} Kč`;
    }

    function getNextInvoiceNumber(prefix = 'INV') {
        const key = 'ezfixInvoiceCounter';
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        let counter = 0;
        try {
            const existing = Number(localStorage.getItem(key) || 0);
            counter = Number.isFinite(existing) ? existing + 1 : 1;
            localStorage.setItem(key, String(counter));
        } catch {
            counter = Math.floor(Math.random() * 9000) + 1000;
        }

        return `${prefix}-${year}${month}-${String(counter).padStart(4, '0')}`;
    }

    function formatInvoiceDate(dateValue) {
        const date = dateValue ? new Date(dateValue) : new Date();
        if (!Number.isFinite(date.getTime())) {
            return new Date().toLocaleDateString('cs-CZ');
        }
        return date.toLocaleDateString('cs-CZ');
    }

    function printInvoiceDocument(invoice) {
        const issueDate = invoice.issueDate || new Date();
        const dueDate = invoice.dueDate || (() => {
            const date = new Date(issueDate);
            date.setDate(date.getDate() + 14);
            return date;
        })();

        const items = Array.isArray(invoice.items) ? invoice.items : [];
        const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);

        const rowsHtml = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(item.description || '')}</td>
                <td>${escapeHtml(String(item.quantity || 1))}</td>
                <td>${formatInvoiceAmount(item.unitPrice || 0)}</td>
                <td style="text-align:right;">${formatInvoiceAmount(item.total || 0)}</td>
            </tr>
        `).join('');

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Pop-up blocked. Please allow pop-ups for printing invoices.');
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="cs">
            <head>
                <meta charset="UTF-8">
                <title>Faktura ${escapeHtml(invoice.invoiceNumber || '')}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 22px; color: #111827; }
                    .top { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
                    .box { flex: 1; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px; }
                    h1 { margin: 0 0 10px; font-size: 1.6rem; }
                    h3 { margin: 0 0 10px; font-size: 1rem; }
                    p { margin: 3px 0; }
                    table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                    th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: left; font-size: 0.95rem; }
                    th { background: #f3f4f6; }
                    .right { text-align: right; }
                    .summary { margin-top: 16px; display: flex; justify-content: flex-end; }
                    .summary-box { min-width: 240px; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
                    .summary-row { display: flex; justify-content: space-between; margin: 6px 0; }
                    .total { font-weight: 700; font-size: 1.08rem; }
                    .notes { margin-top: 18px; white-space: pre-wrap; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>Faktura</h1>
                <div class="top">
                    <div class="box">
                        <h3>Dodavatel</h3>
                        <p><strong>EzFix</strong></p>
                        <p>Web: ezfix.cz</p>
                        <p>E-mail: ezfix.podpora@gmail.com</p>
                        <p>Telefon: +420 732 434 201</p>
                    </div>
                    <div class="box">
                        <h3>Odběratel</h3>
                        <p><strong>${escapeHtml(invoice.customerName || '')}</strong></p>
                        <p>${escapeHtml(invoice.customerEmail || '')}</p>
                        <p>${escapeHtml(invoice.customerPhone || '')}</p>
                        <p>${escapeHtml(invoice.customerAddress || '')}</p>
                    </div>
                </div>

                <div class="top" style="margin-bottom: 8px;">
                    <div class="box">
                        <p><strong>Číslo faktury:</strong> ${escapeHtml(invoice.invoiceNumber || '')}</p>
                        <p><strong>Datum vystavení:</strong> ${formatInvoiceDate(issueDate)}</p>
                        <p><strong>Datum splatnosti:</strong> ${formatInvoiceDate(dueDate)}</p>
                    </div>
                    <div class="box">
                        <p><strong>Variabilní symbol:</strong> ${escapeHtml(String(invoice.variableSymbol || '').replace(/\D/g, '').slice(-10) || '')}</p>
                        <p><strong>Objednávka:</strong> ${escapeHtml(invoice.orderNumber || 'Vlastní faktura')}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Položka</th>
                            <th>Množství</th>
                            <th>Cena/ks</th>
                            <th class="right">Celkem</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml || '<tr><td colspan="5">Bez položek</td></tr>'}
                    </tbody>
                </table>

                <div class="summary">
                    <div class="summary-box">
                        <div class="summary-row total"><span>Celkem k úhradě</span><span>${formatInvoiceAmount(total)}</span></div>
                    </div>
                </div>

                ${invoice.notes ? `<div class="notes"><strong>Poznámka:</strong>\n${escapeHtml(invoice.notes)}</div>` : ''}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    }

    async function printInvoiceForOrder(orderId) {
        try {
            const result = await apiCall('GET', `/orders/${orderId}`);
            const order = result.order || {};
            const items = Array.isArray(order.items) ? order.items : [];

            const mappedItems = items.map((item) => {
                const quantity = Number(item.parts || 1);
                const safeQty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
                const unitPrice = Number(item.price || 0);
                const safePrice = Number.isFinite(unitPrice) ? unitPrice : 0;
                const description = item.repair_name || item.repair_type || [item.device, item.brand, item.model].filter(Boolean).join(' ');

                return {
                    description,
                    quantity: safeQty,
                    unitPrice: safePrice,
                    total: safeQty * safePrice
                };
            });

            const addressParts = [order.customer_address, order.customer_city, order.customer_zip, order.country]
                .map((part) => String(part || '').trim())
                .filter(Boolean);

            printInvoiceDocument({
                invoiceNumber: getNextInvoiceNumber('INV'),
                variableSymbol: order.order_number || String(order.id || ''),
                orderNumber: order.order_number || '',
                customerName: order.customer_name || '',
                customerEmail: order.customer_email || '',
                customerPhone: order.customer_phone || '',
                customerAddress: addressParts.join(', '),
                issueDate: new Date(),
                dueDate: (() => {
                    const date = new Date();
                    date.setDate(date.getDate() + 14);
                    return date;
                })(),
                notes: order.notes || '',
                items: mappedItems
            });
        } catch (error) {
            console.error('Invoice generation failed:', error);
            showToast('Failed to create invoice from order');
        }
    }

    function closeCustomInvoiceModal() {
        const modal = document.getElementById('customInvoiceModal');
        if (modal) modal.remove();
    }

    function openCustomInvoiceModal() {
        if (!Storage.getToken() || !canManageOrders(Storage.getUser())) {
            showToast('Order manager access required');
            return;
        }

        closeCustomInvoiceModal();

        const modalHtml = `
            <div class="modal-overlay" id="customInvoiceModal">
                <div class="modal manual-order-modal" role="dialog" aria-modal="true" aria-label="Create custom invoice">
                    <div class="modal-header">
                        <h3>Create Custom Invoice</h3>
                        <button class="modal-close" type="button" id="customInvoiceCloseBtn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form class="modal-body manual-order-form" id="customInvoiceForm">
                        <div class="manual-order-grid">
                            <div class="form-group">
                                <label for="invoiceCustomerName">Customer Name</label>
                                <input type="text" id="invoiceCustomerName" required>
                            </div>
                            <div class="form-group">
                                <label for="invoiceCustomerEmail">Customer Email</label>
                                <input type="email" id="invoiceCustomerEmail">
                            </div>
                            <div class="form-group">
                                <label for="invoiceCustomerPhone">Customer Phone</label>
                                <input type="text" id="invoiceCustomerPhone">
                            </div>
                            <div class="form-group">
                                <label for="invoiceCustomerAddress">Address</label>
                                <input type="text" id="invoiceCustomerAddress">
                            </div>
                            <div class="form-group">
                                <label for="invoiceItemDescription">Item / Service</label>
                                <input type="text" id="invoiceItemDescription" required>
                            </div>
                            <div class="form-group">
                                <label for="invoiceItemQuantity">Quantity</label>
                                <input type="number" id="invoiceItemQuantity" min="1" step="1" value="1" required>
                            </div>
                            <div class="form-group">
                                <label for="invoiceItemPrice">Unit Price</label>
                                <input type="number" id="invoiceItemPrice" min="0" step="0.01" required>
                            </div>
                            <div class="form-group">
                                <label for="invoiceDueDays">Due in days</label>
                                <input type="number" id="invoiceDueDays" min="1" step="1" value="14" required>
                            </div>
                        </div>
                        <div class="form-group" style="margin-top:8px;">
                            <label for="invoiceNotes">Notes</label>
                            <textarea id="invoiceNotes" rows="3"></textarea>
                        </div>
                        <div class="modal-actions" style="margin-top: 16px;">
                            <button class="btn btn-secondary" type="button" id="customInvoiceCancelBtn">Cancel</button>
                            <button class="btn btn-primary" type="submit" id="customInvoiceSubmitBtn">Create Invoice</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('customInvoiceModal');
        const closeBtn = document.getElementById('customInvoiceCloseBtn');
        const cancelBtn = document.getElementById('customInvoiceCancelBtn');
        const form = document.getElementById('customInvoiceForm');
        const submitBtn = document.getElementById('customInvoiceSubmitBtn');

        modal?.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeCustomInvoiceModal();
            }
        });

        closeBtn?.addEventListener('click', closeCustomInvoiceModal);
        cancelBtn?.addEventListener('click', closeCustomInvoiceModal);

        form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!submitBtn) return;

            const original = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            try {
                const quantityRaw = Number(document.getElementById('invoiceItemQuantity')?.value || 1);
                const unitPriceRaw = Number(document.getElementById('invoiceItemPrice')?.value || 0);
                const dueDaysRaw = Number(document.getElementById('invoiceDueDays')?.value || 14);

                const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 1;
                const unitPrice = Number.isFinite(unitPriceRaw) && unitPriceRaw >= 0 ? unitPriceRaw : 0;
                const dueDays = Number.isFinite(dueDaysRaw) && dueDaysRaw > 0 ? Math.floor(dueDaysRaw) : 14;

                const issueDate = new Date();
                const dueDate = new Date(issueDate);
                dueDate.setDate(dueDate.getDate() + dueDays);
                const invoiceNumber = getNextInvoiceNumber('CINV');

                printInvoiceDocument({
                    invoiceNumber,
                    variableSymbol: invoiceNumber.replace(/\D/g, '').slice(-10),
                    customerName: String(document.getElementById('invoiceCustomerName')?.value || '').trim(),
                    customerEmail: String(document.getElementById('invoiceCustomerEmail')?.value || '').trim(),
                    customerPhone: String(document.getElementById('invoiceCustomerPhone')?.value || '').trim(),
                    customerAddress: String(document.getElementById('invoiceCustomerAddress')?.value || '').trim(),
                    issueDate,
                    dueDate,
                    notes: String(document.getElementById('invoiceNotes')?.value || '').trim(),
                    items: [
                        {
                            description: String(document.getElementById('invoiceItemDescription')?.value || '').trim(),
                            quantity,
                            unitPrice,
                            total: quantity * unitPrice
                        }
                    ]
                });

                closeCustomInvoiceModal();
            } catch (error) {
                console.error('Custom invoice creation failed:', error);
                showToast('Failed to create custom invoice');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = original;
            }
        });
    }

    /**
     * Print order details
     */
    async function printOrderDetails(orderId) {
        try {
            const res = await apiCall('GET', `/orders/${orderId}`);
            const o = res.order || {};
            const items = o.items || [];

            let itemsHtml = '';
            items.forEach(item => {
                const customDetails = getCustomBuildDetails(item);
                const printingDetails = getPrintingDetails(item);
                const otherDetails = getOtherItemDetails(item);
                const detailLine = customDetails
                    ? `Build Type: ${escapeHtml(customDetails.buildType)}${customDetails.partsSummary ? ' | Parts: ' + escapeHtml(customDetails.partsSummary) : ''}`
                    : printingDetails
                        ? `Printer: ${escapeHtml(printingDetails.printer || 'N/A')} | Filament: ${escapeHtml(printingDetails.filament || 'N/A')} | Color: ${escapeHtml(printingDetails.color || 'N/A')} | Strength: ${escapeHtml(printingDetails.strength || 'N/A')} | Parts: ${escapeHtml(String(printingDetails.parts || 1))}${printingDetails.fileName ? ' | File: ' + escapeHtml(printingDetails.fileName) : ''}`
                        : otherDetails
                            ? `Item: ${escapeHtml(otherDetails.name || 'Other Item')}${otherDetails.desc ? ' | Details: ' + escapeHtml(otherDetails.desc) : ''}`
                            : `${escapeHtml(item.brand || '')} ${escapeHtml(item.model || '')}`;
                itemsHtml += `<tr><td>${escapeHtml(item.repair_name || item.repair_type || 'Repair')}</td><td>${detailLine}</td><td style="text-align:right;">${formatCurrency(item.price || 0)}</td></tr>`;
            });

            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Order ${escapeHtml(o.order_number || '')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .header h1 { margin: 0; }
                        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
                        .info-section { }
                        .info-section h3 { margin: 0 0 10px 0; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                        .info-line { margin: 5px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                        th { background: #f5f5f5; font-weight: bold; }
                        .total { margin-top: 20px; text-align: right; font-weight: bold; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${t('Order Details')}</h1>
                        <p>${t('Order #')}${escapeHtml(o.order_number || '')}</p>
                    </div>
                    
                    <div class="info-grid">
                        <div class="info-section">
                            <h3>${t('Customer Info')}</h3>
                            <div class="info-line"><strong>${t('Name')}:</strong> ${escapeHtml(o.customer_name || '')}</div>
                            <div class="info-line"><strong>${t('Email')}:</strong> ${escapeHtml(o.customer_email || '')}</div>
                            <div class="info-line"><strong>${t('Phone')}:</strong> ${escapeHtml(normalizePhoneForDisplay(o.customer_phone || ''))}</div>
                            <div class="info-line"><strong>${t('Address')}:</strong> ${escapeHtml(o.customer_address || t('N/A'))}</div>
                            ${o.customer_city ? `<div class="info-line"><strong>${t('City')}:</strong> ${o.customer_city}</div>` : ''}
                            ${o.customer_zip ? `<div class="info-line"><strong>${t('ZIP Code')}:</strong> ${o.customer_zip}</div>` : ''}
                        </div>
                        <div class="info-section">
                            <h3>${t('Order Info')}</h3>
                            <div class="info-line"><strong>${t('Date')}:</strong> ${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</div>
                            <div class="info-line"><strong>${t('Service Type')}:</strong> ${formatServiceTypeLabel(o.service_type || '')}</div>
                            <div class="info-line"><strong>${t('Status')}:</strong> ${formatStatusLabel(o.status || '')}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr><th>${t('Repair')}</th><th>${t('Device')}</th><th>${t('Price')}</th></tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                    </table>

                    ${o.notes ? `<div><strong>${t('Notes')}:</strong><p>${o.notes}</p></div>` : ''}

                    <div class="total">${t('Total')}: ${formatCurrency(o.total || 0)}</div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        } catch (e) {
            console.error('Print error:', e);
            showToast('Failed to print order details');
        }
    }

    // ========================================================================
    // MODULE 11: AUTHENTICATION FUNCTIONS
    // Admin login, logout, and credential management
    // ========================================================================

    /**
     * Support dialog helper to show login modal
     */
    function showSupportDialog() {
        const modal = DOM.loginModal;
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = '';
        }
    }

    /**
     * Hide login modal
     */
    function hideLoginModal() {
        const modal = DOM.loginModal;
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function createLoginProgressController() {
        const modal = document.getElementById('loginProgressModal');
        const titleEl = document.getElementById('loginProgressTitle');
        const textEl = document.getElementById('loginProgressText');
        const fillEl = document.getElementById('loginProgressFill');
        const stepEls = Array.from(document.querySelectorAll('#loginProgressSteps .login-progress-step'));

        if (!modal || !titleEl || !textEl || !fillEl || stepEls.length === 0) {
            return {
                show: () => {},
                update: () => {},
                complete: () => {},
                error: () => {},
                hide: () => {}
            };
        }

        const percentages = [18, 58, 100];

        const updateStepClasses = (stepIndex) => {
            stepEls.forEach((el, index) => {
                el.classList.remove('active', 'done');
                if (index < stepIndex) el.classList.add('done');
                if (index === stepIndex) el.classList.add('active');
            });
        };

        return {
            show(title = 'Signing you in', text = 'Preparing secure login...') {
                titleEl.textContent = title;
                textEl.textContent = text;
                fillEl.style.width = '0%';
                updateStepClasses(0);
                modal.classList.remove('hidden');
                modal.setAttribute('aria-hidden', 'false');
            },
            update(step = 1, text = '') {
                const idx = Math.max(0, Math.min(2, Number(step) - 1));
                if (text) textEl.textContent = text;
                fillEl.style.width = `${percentages[idx]}%`;
                updateStepClasses(idx);
            },
            complete(text = 'Done. Redirecting...') {
                textEl.textContent = text;
                fillEl.style.width = '100%';
                stepEls.forEach(el => {
                    el.classList.remove('active');
                    el.classList.add('done');
                });
            },
            error(text = 'Login failed') {
                textEl.textContent = text;
            },
            hide() {
                modal.classList.add('hidden');
                modal.setAttribute('aria-hidden', 'true');
            }
        };
    }

    /**
     * Handle user/admin login via API
     * @param {Event} e - Form submission event
     */
    async function handleAdminLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        const btn = e.target.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        const progress = createLoginProgressController();

        try {
            btn.disabled = true;
            btn.textContent = t('Logging in...');
            errorDiv.textContent = '';
            progress.show('Signing you in', 'Step 1/3: Verifying credentials...');
            progress.update(1, 'Step 1/3: Verifying credentials...');

            const result = await apiCall('POST', '/auth/login', { username, password });
            progress.update(2, 'Step 2/3: Loading account permissions...');
            
            // Store token and user info
            Storage.setToken(result.token);
            Storage.setUser(result.user);
            Storage.setAdminLoggedIn(canAccessAdmin(result.user));

            progress.update(3, 'Step 3/3: Preparing dashboard...');
            
            hideLoginModal();
            updateAuthUI();
            document.getElementById('loginForm').reset();
            showToast('Login successful');
            progress.complete('Login successful. Redirecting...');
            await new Promise(resolve => setTimeout(resolve, 260));
            showPage(canAccessAdmin(result.user) ? 'admin' : 'home');
        } catch (error) {
            errorDiv.textContent = t(error.message || 'Invalid username or password');
            console.error('Login error:', error);
            progress.error(t(error.message || 'Login failed'));
            await new Promise(resolve => setTimeout(resolve, 480));
        } finally {
            progress.hide();
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    /**
     * Handle admin logout
     */
    async function handleLogout() {
        try {
            await apiCall('POST', '/auth/logout', {});
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        clearAuth();
        updateAuthUI();
        showPage('home');
        showToast('Logged out successfully');
    }

    /**
     * Update UI elements based on authentication state
     */
    function updateAuthUI() {
        const logoutBtn = DOM.logoutBtn;
        const logoutBtnMobile = document.getElementById('logoutBtnMobile');
        const adminNavLink = document.getElementById('adminNavLink');
        const isLoggedIn = !!Storage.getToken();
        const currentUser = Storage.getUser();
        const isAdmin = Storage.adminLoggedIn && isLoggedIn;
        const role = currentUser?.role;
        const isOwner = isOwnerRole(role);
        const canCatalog = canManageCatalog(currentUser);
        const canOrders = canManageOrders(currentUser);
        const canChats = canAccessChats(currentUser);
        const canCredentials = canAccessCredentials(currentUser);
        const profileNavBtn = document.getElementById('profileNavBtn');
        const profileNavBtnMobile = document.getElementById('profileNavBtnMobile');

        if (isAdmin) {
            mountAdminPageNode();
        } else {
            unmountAdminPageNode();
            if ((window.location.hash || '').startsWith('#admin')) {
                window.location.hash = '#home';
            }
        }

        const credentialsTabBtn = document.querySelector('.admin-tab-btn[data-tab="credentials"]');
        const credentialsContent = document.getElementById('credentials-content');
        const catalogTabBtn = document.querySelector('.admin-tab-btn[data-tab="catalog"]');
        const catalogContent = document.getElementById('catalog-content');
        const chatsTabBtn = document.querySelector('.admin-tab-btn[data-tab="chats"]');
        const chatsContent = document.getElementById('chats-content');
        const orderTabs = ['repairs', 'custom-pc', 'printing', 'other-items', 'used-shop'];

        if (logoutBtn) logoutBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
        if (logoutBtnMobile) logoutBtnMobile.style.display = isLoggedIn ? 'inline-flex' : 'none';
        if (adminNavLink) adminNavLink.style.display = isAdmin ? 'list-item' : 'none';
        if (DOM.loginNavBtn) DOM.loginNavBtn.style.display = isLoggedIn ? 'none' : 'inline-flex';
        const loginNavBtnMobile = document.getElementById('loginNavBtnMobile');
        if (loginNavBtnMobile) loginNavBtnMobile.style.display = isLoggedIn ? 'none' : 'inline-flex';
        if (profileNavBtn) profileNavBtn.style.display = isLoggedIn ? 'inline-flex' : 'none';
        if (profileNavBtnMobile) profileNavBtnMobile.style.display = isLoggedIn ? 'inline-flex' : 'none';
        orderTabs.forEach((tab) => {
            const tabBtn = document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`);
            const tabContent = document.getElementById(`${tab}-content`);
            const allowed = canOrders;
            if (tabBtn) tabBtn.style.display = allowed ? 'inline-flex' : 'none';
            if (!allowed && tabContent) tabContent.classList.remove('active');
        });
        if (credentialsTabBtn) credentialsTabBtn.style.display = canCredentials ? 'inline-flex' : 'none';
        if (!canCredentials && credentialsContent) {
            credentialsContent.classList.remove('active');
        }
        if (catalogTabBtn) catalogTabBtn.style.display = canCatalog ? 'inline-flex' : 'none';
        if (!canCatalog && catalogContent) {
            catalogContent.classList.remove('active');
        }
        if (chatsTabBtn) chatsTabBtn.style.display = canChats ? 'inline-flex' : 'none';
        if (!canChats && chatsContent) {
            chatsContent.classList.remove('active');
        }
    }

    /**
     * Refresh auth state from API when a token exists
     */
    async function refreshAuthState() {
        if (!Storage.getToken()) {
            Storage.setUser(null);
            Storage.setAdminLoggedIn(false);
            return;
        }

        try {
            const result = await apiCall('GET', '/auth/me');
            if (result && result.success) {
                Storage.setUser(result.user);
                Storage.setAdminLoggedIn(canAccessAdmin(result.user));
            } else {
                Storage.setUser(null);
                Storage.setAdminLoggedIn(false);
            }
        } catch {
            clearAuth();
        }
    }

    /**
     * Add new admin user
     * @param {string} username - Username for new user
     * @param {string} password - Password for new user
     * @returns {object} Result with success flag and message
     */
    /**
     * Add admin user via API
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise} Result with success flag and message
     */
    async function addAdminUser(username, password, email, role) {
        try {
            const result = await apiCall('POST', '/admin/users', {
                username,
                password,
                email,
                role,
                permissions: getPermissionSelection('new')
            });

            return { success: true, message: `User "${username}" added successfully`, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Update admin user password via API
     * @param {string} username - Username to update
     * @param {string} newPassword - New password
     * @returns {Promise} Result with success flag and message
     */
    async function updateAdminUser(username, newPassword) {
        try {
            // First get the user ID
            const usersResult = await apiCall('GET', '/admin/users');
            const user = usersResult.users.find(u => u.username === username);

            if (!user) {
                return { success: false, message: `User "${username}" not found` };
            }

            // Update password
            const result = await apiCall('POST', `/admin/users/${user.id}/password`, {
                password: newPassword
            });

            return { success: true, message: `Password updated for "${username}"`, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Delete admin user via API
     * @param {string} username - Username to delete
     * @returns {Promise} Result with success flag and message
     */
    async function deleteAdminUser(username) {
        try {
            // Get user ID first
            const usersResult = await apiCall('GET', '/admin/users');
            const user = usersResult.users.find(u => u.username === username);

            if (!user) {
                return { success: false, message: `User "${username}" not found` };
            }

            // Delete user
            await apiCall('DELETE', `/admin/users/${user.id}`);

            return { success: true, message: `User "${username}" deleted successfully` };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Update admin user details via API
     * @param {number} userId - User ID
     * @param {object} payload - Fields to update
     * @returns {Promise} Result with success flag and message
     */
    async function updateAdminUserDetails(userId, payload) {
        try {
            const result = await apiCall('PUT', `/admin/users/${userId}`, payload);
            return { success: true, message: result.message || 'User updated', data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async function fetchAdminUserDetails(userId) {
        try {
            const result = await apiCall('GET', `/admin/users/${userId}/details`);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    function closeAdminUserDetailsModal() {
        const modal = document.getElementById('adminUserDetailsModal');
        if (modal) modal.remove();
    }

    function getPermissionSelection(prefix) {
        const checked = [];
        if (document.getElementById(`${prefix}PermOrders`)?.checked) checked.push('orders');
        if (document.getElementById(`${prefix}PermCatalog`)?.checked) checked.push('catalog');
        if (document.getElementById(`${prefix}PermChats`)?.checked) checked.push('chats');
        if (document.getElementById(`${prefix}PermCredentials`)?.checked) checked.push('credentials');
        return checked;
    }

    function applyPermissionSelection(prefix, permissions = [], role = 'manager') {
        const perms = Array.isArray(permissions) ? permissions : [];
        const owner = role === 'owner';
        const orderInput = document.getElementById(`${prefix}PermOrders`);
        const catalogInput = document.getElementById(`${prefix}PermCatalog`);
        const chatsInput = document.getElementById(`${prefix}PermChats`);
        const credentialsInput = document.getElementById(`${prefix}PermCredentials`);
        const container = document.getElementById(`${prefix}PermissionsGroup`);

        if (orderInput) orderInput.checked = owner || perms.includes('orders');
        if (catalogInput) catalogInput.checked = owner || perms.includes('catalog');
        if (chatsInput) chatsInput.checked = owner || perms.includes('chats');
        if (credentialsInput) credentialsInput.checked = owner || perms.includes('credentials');

        [orderInput, catalogInput, chatsInput, credentialsInput].forEach((input) => {
            if (!input) return;
            input.disabled = owner;
        });

        if (container) {
            container.style.opacity = owner ? '0.7' : '1';
        }
    }
    let isCustomerUsersHidden = false;

    function syncCustomerUsersVisibility() {
        const section = document.getElementById('credentialsCustomerUsersSection');
        const toggleBtn = document.getElementById('toggleCustomerUsersBtn');
        if (!section || !toggleBtn) return;

        section.classList.toggle('is-collapsed', isCustomerUsersHidden);
        toggleBtn.textContent = isCustomerUsersHidden ? t('Show') : t('Hide');
    }

    function initCustomerUsersToggle() {
        const toggleBtn = document.getElementById('toggleCustomerUsersBtn');
        if (!toggleBtn || toggleBtn.dataset.bound === '1') return;

        toggleBtn.addEventListener('click', () => {
            isCustomerUsersHidden = !isCustomerUsersHidden;
            syncCustomerUsersVisibility();
        });

        toggleBtn.dataset.bound = '1';
        syncCustomerUsersVisibility();
    }

    /**
     * Render credentials management UI by fetching from API
     */
    async function renderCredentialsUI() {
        initCustomerUsersToggle();
        try {
            const result = await apiCall('GET', '/admin/users');
            const users = result.users || [];
            window.adminUsersCache = users;

            const usersList = document.getElementById('usersList');
            const usersListCustomers = document.getElementById('usersListCustomers');
            const adminRoles = new Set(['owner', 'manager', 'worker']);
            const adminUsers = users.filter(user => adminRoles.has(String(user.role || '').toLowerCase()));
            const customerUsers = users.filter(user => !adminRoles.has(String(user.role || '').toLowerCase()));

            const renderUserRows = (list) => {
                if (!Array.isArray(list) || list.length === 0) {
                    return `<div class="user-item users-empty"><div class="user-info"><span class="user-name">No users found</span></div></div>`;
                }
                return list.map(user => `
                    <div class="user-item" data-user-id="${user.id}">
                        <div class="user-info">
                            <span class="user-name">${user.username}</span>
                            ${user.email ? `<span class="user-email">${user.email}</span>` : ''}
                            <span class="user-role">${t(user.role || 'customer')}</span>
                            ${(Array.isArray(user.permissions) && user.permissions.length > 0)
                                ? `<span class="user-email">Access: ${user.permissions.join(', ')}</span>`
                                : ''}
                        </div>
                        <div class="user-actions">
                            <button type="button" class="user-details-btn" data-detail-id="${user.id}">Details</button>
                            <button type="button" class="user-edit-btn" data-edit-id="${user.id}">Edit</button>
                            <button type="button" class="user-delete-btn" data-delete-username="${user.username}">Delete</button>
                        </div>
                    </div>
                `).join('');
            };

            const bindUserActions = (container) => {
                if (!container) return;
                container.querySelectorAll('.user-edit-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const userId = parseInt(btn.dataset.editId, 10);
                        if (Number.isFinite(userId)) {
                            handleEditUserUI(userId);
                        }
                    });
                });

                container.querySelectorAll('.user-details-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const userId = parseInt(btn.dataset.detailId, 10);
                        if (Number.isFinite(userId)) {
                            handleViewUserDetailsUI(userId);
                        }
                    });
                });

                container.querySelectorAll('.user-delete-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const username = btn.dataset.deleteUsername || '';
                        if (username) {
                            handleDeleteUserUI(username);
                        }
                    });
                });
            };

            if (usersList) {
                usersList.innerHTML = renderUserRows(adminUsers);
                bindUserActions(usersList);
            }

            if (usersListCustomers) {
                usersListCustomers.innerHTML = renderUserRows(customerUsers);
                bindUserActions(usersListCustomers);
            }

            syncCustomerUsersVisibility();
        } catch (error) {
            showToast('Failed to load users: ' + error.message);
        }
    }

    async function handleViewUserDetailsUI(userId) {
        closeAdminUserDetailsModal();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'adminUserDetailsModal';
        modal.innerHTML = `
            <div class="modal admin-user-details-modal" role="dialog" aria-modal="true" aria-label="User details">
                <div class="modal-header">
                    <h3>User Details</h3>
                    <button class="modal-close" type="button" aria-label="Close user details">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div id="adminUserDetailsMessage" class="profile-empty">Loading user details...</div>
                    <div class="profile-grid" id="adminUserDetailsGrid" style="display:none; margin-bottom:16px;">
                        <div class="profile-stat"><span class="label">Username</span><span class="value" id="adminDetailUsername">-</span></div>
                        <div class="profile-stat"><span class="label">Email</span><span class="value" id="adminDetailEmail">-</span></div>
                        <div class="profile-stat"><span class="label">Role</span><span class="value" id="adminDetailRole">-</span></div>
                        <div class="profile-stat"><span class="label">Created</span><span class="value" id="adminDetailCreated">-</span></div>
                    </div>
                    <div id="adminDetailActionsWrapper" style="margin-bottom:16px; display:none;"><button type="button" class="btn btn-secondary" id="adminResetPasswordBtn">Reset Password</button></div>
                    <h4 style="margin: 10px 0;">Orders</h4>
                    <div id="adminUserOrdersList" class="profile-history-list">
                        <div class="profile-empty">Loading orders...</div>
                    </div>
                    <h4 style="margin: 18px 0 10px;">Chats</h4>
                    <div id="adminUserChatsList" class="profile-history-list">
                        <div class="profile-empty">Loading chats...</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn?.addEventListener('click', closeAdminUserDetailsModal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeAdminUserDetailsModal();
            }
        });

        const messageEl = document.getElementById('adminUserDetailsMessage');
        const gridEl = document.getElementById('adminUserDetailsGrid');
        const usernameEl = document.getElementById('adminDetailUsername');
        const emailEl = document.getElementById('adminDetailEmail');
        const roleEl = document.getElementById('adminDetailRole');
        const createdEl = document.getElementById('adminDetailCreated');
        const ordersListEl = document.getElementById('adminUserOrdersList');
        const chatsListEl = document.getElementById('adminUserChatsList');
        const actionsWrapperEl = document.getElementById('adminDetailActionsWrapper');
        const resetPasswordBtn = document.getElementById('adminResetPasswordBtn');

        const detailsResult = await fetchAdminUserDetails(userId);
        if (!detailsResult.success || !detailsResult.data) {
            if (messageEl) messageEl.textContent = `Failed to load user details: ${detailsResult.message || 'Unknown error'}`;
            if (ordersListEl) ordersListEl.innerHTML = '<div class="profile-empty">Failed to load order history.</div>';
            if (chatsListEl) chatsListEl.innerHTML = '<div class="profile-empty">Failed to load chat history.</div>';
            return;
        }

        const user = detailsResult.data.user || {};
        const orders = Array.isArray(detailsResult.data.orders) ? detailsResult.data.orders : [];
        const chats = Array.isArray(detailsResult.data.chats) ? detailsResult.data.chats : [];

        if (usernameEl) usernameEl.textContent = user.username || '-';
        if (emailEl) emailEl.textContent = user.email || '-';
        if (roleEl) roleEl.textContent = formatProfileRoleLabel(user.role);
        if (createdEl) createdEl.textContent = formatDateTimeSafe(user.created_at);
        if (messageEl) messageEl.textContent = '';
        if (gridEl) gridEl.style.display = 'grid';
        if (actionsWrapperEl) actionsWrapperEl.style.display = 'block';
        if (resetPasswordBtn) {
            resetPasswordBtn.addEventListener('click', async () => {
                const newPassword = window.prompt(`${t('Enter a new password for')} ${user.username}:`);
                if (!newPassword) return;
                if (newPassword.length < 8) {
                    showToast('Password must be at least 8 characters');
                    return;
                }
                if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                    showToast('Password must contain uppercase, lowercase, and numbers');
                    return;
                }
                try {
                    const result = await apiCall('POST', `/admin/users/${user.id}/password`, { newPassword });
                    if (result.success) {
                        showToast(`Password reset successfully for ${user.username}`);
                    } else {
                        showToast(`Failed to reset password: ${result.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    showToast(`Error resetting password: ${error.message}`);
                }
            });
        }

        if (!orders.length) {
            if (ordersListEl) ordersListEl.innerHTML = '<div class="profile-empty">No orders yet.</div>';
        } else {
            const detailsByOrderId = new Map();
            await Promise.all(orders.map(async (order) => {
                try {
                    const result = await apiCall('GET', `/orders/${order.id}`);
                    if (result?.success && result.order) {
                        detailsByOrderId.set(String(order.id), result.order);
                    }
                } catch {
                    // Keep order visible even if detail loading fails.
                }
            }));

            if (ordersListEl) {
                ordersListEl.innerHTML = orders.map((order) => {
                    const orderIdKey = String(order.id || '');
                    const details = detailsByOrderId.get(orderIdKey);
                    const items = Array.isArray(details?.items) ? details.items : [];

                    const detailRows = [
                        `<div><strong>Service:</strong> ${escapeHtml(formatServiceTypeLabel(details?.service_type || ''))}</div>`,
                        `<div><strong>Payment:</strong> ${escapeHtml(String(details?.payment_method || 'N/A'))}</div>`,
                        `<div><strong>Created:</strong> ${escapeHtml(formatDateTimeSafe(details?.created_at || order.created_at))}</div>`,
                        `<div><strong>Updated:</strong> ${escapeHtml(formatDateTimeSafe(details?.updated_at || order.updated_at))}</div>`
                    ].join('');

                    const itemsHtml = items.length
                        ? `<div class="profile-order-items">${items.map((item) => `
                            <div class="profile-order-item">
                                <div><strong>${escapeHtml(item.repair_name || item.repair_type || 'Item')}</strong></div>
                                <div class="meta">${escapeHtml([item.device, item.brand, item.model].filter(Boolean).join(' • '))}</div>
                                <div class="meta">${escapeHtml(formatCurrency(item.price || 0))}</div>
                            </div>
                        `).join('')}</div>`
                        : '<div class="profile-empty">No item details available.</div>';

                    const detailsHtml = details
                        ? `${detailRows}${itemsHtml}`
                        : '<div class="profile-empty">Order details unavailable.</div>';

                    return `
                        <div class="profile-history-item">
                            <div class="profile-order-header">
                                <div>
                                    <div class="title">#${escapeHtml(order.order_number || String(order.id || ''))}</div>
                                    <div class="meta">Status: ${escapeHtml(formatStatusLabel(order.status || ''))} • ${escapeHtml(formatDateTimeSafe(order.created_at))}</div>
                                    <div class="preview">Total: ${escapeHtml(formatCurrency(order.total || 0))} • Items: ${escapeHtml(String(order.item_count || 0))}</div>
                                </div>
                                <button type="button" class="btn btn-sm btn-secondary admin-order-toggle" data-admin-order-toggle="${escapeHtml(orderIdKey)}" aria-expanded="false">Show details</button>
                            </div>
                            <div class="profile-order-details" data-admin-order-details="${escapeHtml(orderIdKey)}" style="display:none;">
                                ${detailsHtml}
                            </div>
                        </div>
                    `;
                }).join('');

                ordersListEl.querySelectorAll('[data-admin-order-toggle]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const orderId = btn.getAttribute('data-admin-order-toggle');
                        if (!orderId) return;
                        const detailsEl = ordersListEl.querySelector(`[data-admin-order-details="${CSS.escape(orderId)}"]`);
                        if (!detailsEl) return;

                        const isVisible = detailsEl.style.display !== 'none';
                        detailsEl.style.display = isVisible ? 'none' : 'block';
                        btn.textContent = isVisible ? 'Show details' : 'Hide details';
                        btn.setAttribute('aria-expanded', isVisible ? 'false' : 'true');
                    });
                });
            }
        }

        if (!chats.length) {
            if (chatsListEl) chatsListEl.innerHTML = '<div class="profile-empty">No chats yet.</div>';
        } else if (chatsListEl) {
            const previewSessions = chats.slice(0, 8);
            chatsListEl.innerHTML = previewSessions.map((session) => {
                const sessionId = String(session.id || '');
                const status = escapeHtml(formatStatusLabel(session.status || 'open'));
                const when = escapeHtml(formatDateTimeSafe(session.last_message_at || session.created_at));
                const preview = escapeHtml(String(session.last_message || 'No messages yet'));

                return `
                    <div class="profile-history-item">
                        <div class="profile-chat-header">
                            <div>
                                <div class="title">Chat ${escapeHtml(sessionId)}</div>
                                <div class="meta">${status} • ${when}</div>
                                <div class="preview">${preview}</div>
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary admin-chat-toggle" data-admin-chat-toggle="${escapeHtml(sessionId)}" aria-expanded="false">Show chat</button>
                        </div>
                        <div class="profile-chat-transcript" data-admin-chat-transcript="${escapeHtml(sessionId)}" data-chat-loaded="false" style="display:none;"></div>
                    </div>
                `;
            }).join('');

            chatsListEl.querySelectorAll('[data-admin-chat-toggle]').forEach((btn) => {
                btn.addEventListener('click', async () => {
                    const sessionId = btn.getAttribute('data-admin-chat-toggle');
                    if (!sessionId) return;
                    const transcriptEl = chatsListEl.querySelector(`[data-admin-chat-transcript="${CSS.escape(sessionId)}"]`);
                    if (!transcriptEl) return;

                    const isVisible = transcriptEl.style.display !== 'none';
                    if (isVisible) {
                        transcriptEl.style.display = 'none';
                        btn.textContent = 'Show chat';
                        btn.setAttribute('aria-expanded', 'false');
                        return;
                    }

                    transcriptEl.style.display = 'block';
                    btn.textContent = 'Hide chat';
                    btn.setAttribute('aria-expanded', 'true');

                    if (transcriptEl.dataset.chatLoaded === 'true') {
                        return;
                    }

                    transcriptEl.innerHTML = '<div class="profile-empty">Loading chat transcript...</div>';
                    try {
                        const result = await apiCall('GET', `/chat/messages/${encodeURIComponent(sessionId)}?markReadUser=0`);
                        const messages = Array.isArray(result?.messages) ? result.messages : [];
                        if (!messages.length) {
                            transcriptEl.innerHTML = '<div class="profile-empty">No messages in this chat.</div>';
                            transcriptEl.dataset.chatLoaded = 'true';
                            return;
                        }

                        transcriptEl.innerHTML = messages.map((msg) => {
                            const type = String(msg.sender_type || '').toLowerCase();
                            const klass = type === 'user' ? 'user' : (type === 'admin' ? 'admin' : 'bot');
                            const sender = escapeHtml(msg.sender_name || msg.sender_type || 'message');
                            const text = escapeHtml(String(msg.message || ''));
                            const time = escapeHtml(formatDateTimeSafe(msg.created_at));
                            return `
                                <div class="profile-chat-message-row ${klass}">
                                    <div class="profile-chat-message"><strong>${sender}:</strong> ${text}</div>
                                    <div class="meta">${time}</div>
                                </div>
                            `;
                        }).join('');

                        transcriptEl.dataset.chatLoaded = 'true';
                    } catch {
                        transcriptEl.innerHTML = '<div class="profile-empty">Failed to load chat transcript.</div>';
                    }
                });
            });
        }
    }

    function handleEditUserUI(userId) {
        const users = window.adminUsersCache || [];
        const user = users.find(u => u.id === userId);
        if (!user) {
            showCredentialsMessage('editUserMessage', 'User not found', false);
            return;
        }

        const editUserId = document.getElementById('editUserId');
        const editUsername = document.getElementById('editUsername');
        const editEmail = document.getElementById('editEmail');
        const editPassword = document.getElementById('editPassword');
        const editRole = document.getElementById('editRole');

        if (editUserId) editUserId.value = String(user.id);
        if (editUsername) editUsername.value = user.username || '';
        if (editEmail) editEmail.value = user.email || '';
        if (editPassword) editPassword.value = '';
        if (editRole) editRole.value = user.role || 'manager';
        applyPermissionSelection('edit', user.permissions || [], user.role || 'manager');
    }
    async function handleDeleteUserUI(username) {
        if (confirm(`${t('Are you sure you want to delete the user')} "${username}"?`)) {
            const result = await deleteAdminUser(username);
            if (result.success) {
                showToast(result.message);
                renderCredentialsUI();
            } else {
                alert(t(result.message));
            }
        }
    }

    /**
     * Show credentials message (success or error)
     * @param {string} elementId - Element ID to display message in
     * @param {string} message - Message to display
     * @param {boolean} isSuccess - True for success, false for error
     */
    function showCredentialsMessage(elementId, message, isSuccess) {
        const messageEl = document.getElementById(elementId);
        if (messageEl) {
            messageEl.textContent = t(message);
            messageEl.classList.remove('success', 'error');
            messageEl.classList.add(isSuccess ? 'success' : 'error');
        }
    }

    // ========================================================================
    // MODULE 12: ORDER MANAGEMENT FUNCTIONS
    // Edit and delete orders from admin panel
    // ========================================================================

    /**
     * Edit order status
     * @param {string} orderId - Order ID to edit
     */
    async function editOrderStatus(orderId) {
        try {
            // Fetch order from API
            const result = await apiCall('GET', `/orders/${orderId}`);
            const order = result.order;
            if (!order) return;

            const modalHtml = `
                <div class="modal-overlay" id="statusModal">
                    <div class="modal">
                        <div class="modal-header">
                            <h3>${t('Edit Order Status')}</h3>
                            <button class="modal-close" onclick="closeStatusModal()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p style="margin-bottom: 16px; color: var(--text-light);"><strong>${t('Order')}:</strong> ${order.order_number}</p>
                            <select id="statusSelect" class="status-select">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>${t('Pending')}</option>
                                <option value="waiting" ${order.status === 'waiting' ? 'selected' : ''}>${t('Waiting')}</option>
                                <option value="in-progress" ${order.status === 'in-progress' ? 'selected' : ''}>${t('In Progress')}</option>
                                <option value="delivering" ${order.status === 'delivering' ? 'selected' : ''}>${t('Delivering')}</option>
                                <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>${t('Completed')}</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>${t('Delivered')}</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>${t('Cancelled')}</option>
                            </select>
                            <div class="modal-actions">
                                <button class="btn btn-secondary" onclick="closeStatusModal()" style="flex: 1;">${t('Cancel')}</button>
                                <button class="btn btn-primary" onclick="saveOrderStatus(${order.id})" style="flex: 1;">${t('Save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            document.getElementById('statusModal').addEventListener('click', function(e) {
                if (e.target === this) closeStatusModal();
            });
        } catch (error) {
            showToast(t('Failed to load order: ') + error.message);
        }
    }

    /**
     * Close status edit modal
     */
    function closeStatusModal() {
        const modal = document.getElementById('statusModal');
        if (modal) modal.remove();
    }

    /**
     * Save order status change via API
     * @param {number} orderId - Order ID
     */
    async function saveOrderStatus(orderId) {
        try {
            const newStatus = document.getElementById('statusSelect').value;
            
            // Update status
            await apiCall('PATCH', `/orders/${orderId}`, { status: newStatus });
            
            // Send status update email
            await sendOrderStatusEmail(orderId, newStatus);
            
            showToast('Order status updated and email sent');
            renderAdminOrders();
            closeStatusModal();
        } catch (error) {
            showToast('Failed to update order: ' + error.message);
        }
    }

    /**
     * Delete order via API
     * @param {number} orderId - Order ID to delete
     */
    async function deleteOrder(orderId) {
        if (confirm(t('Are you sure you want to delete this order?'))) {
            try {
                await apiCall('DELETE', `/orders/${orderId}`);
                showToast('Order deleted');
                renderAdminOrders();
            } catch (error) {
                showToast('Failed to delete order: ' + error.message);
            }
        }
    }

    function closeManualOrderModal() {
        const modal = document.getElementById('manualOrderModal');
        if (modal) modal.remove();
    }

    function openManualOrderModal() {
        if (!Storage.getToken() || !canManageOrders(Storage.getUser())) {
            showToast('Order manager access required');
            return;
        }

        closeManualOrderModal();

        const modalHtml = `
            <div class="modal-overlay" id="manualOrderModal">
                <div class="modal manual-order-modal" role="dialog" aria-modal="true" aria-label="Create order manually">
                    <div class="modal-header">
                        <h3>Create Order</h3>
                        <button class="modal-close" type="button" id="manualOrderCloseBtn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form class="modal-body manual-order-form" id="manualOrderForm">
                        <div class="manual-order-grid">
                            <div class="form-group">
                                <label for="manualCustomerName">Customer Name</label>
                                <input type="text" id="manualCustomerName" required>
                            </div>
                            <div class="form-group">
                                <label for="manualCustomerEmail">Customer Email</label>
                                <input type="email" id="manualCustomerEmail" required>
                            </div>
                            <div class="form-group">
                                <label for="manualCustomerPhone">Customer Phone</label>
                                <input type="text" id="manualCustomerPhone" required>
                            </div>
                            <div class="form-group">
                                <label for="manualServiceType">Service Type</label>
                                <select id="manualServiceType" required>
                                    <option value="pickup">Pickup</option>
                                    <option value="delivery">Delivery</option>
                                    <option value="zasilkovna">Zasilkovna</option>
                                    <option value="ceska-posta">Ceska posta</option>
                                    <option value="ppl">PPL</option>
                                    <option value="dpd">DPD</option>
                                    <option value="gls">GLS</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="manualOrderStatus">Order Status</label>
                                <select id="manualOrderStatus" required>
                                    <option value="pending">Pending</option>
                                    <option value="waiting">Waiting</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="delivering">Delivering</option>
                                    <option value="completed">Completed</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="manualCountry">Country</label>
                                <input type="text" id="manualCountry" value="Czech Republic">
                            </div>
                            <div class="form-group">
                                <label for="manualAddress">Address</label>
                                <input type="text" id="manualAddress">
                            </div>
                            <div class="form-group">
                                <label for="manualCity">City</label>
                                <input type="text" id="manualCity">
                            </div>
                            <div class="form-group">
                                <label for="manualZip">ZIP</label>
                                <input type="text" id="manualZip">
                            </div>
                        </div>

                        <div class="manual-order-items">
                            <div class="manual-order-items-header">
                                <h4>Items</h4>
                                <button class="btn btn-secondary btn-sm" type="button" id="manualAddItemBtn">Add Item</button>
                            </div>
                            <div id="manualOrderItemsList"></div>
                            <div class="manual-order-total" id="manualOrderTotal">Total: 0.00 Kč</div>
                        </div>

                        <div class="form-group" style="margin-top: 8px;">
                            <label for="manualOrderNotes">Notes</label>
                            <textarea id="manualOrderNotes" rows="3"></textarea>
                        </div>
                        <div class="modal-actions" style="margin-top: 16px;">
                            <button class="btn btn-secondary" type="button" id="manualOrderCancelBtn">Cancel</button>
                            <button class="btn btn-primary" type="submit" id="manualOrderSubmitBtn">Create Order</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('manualOrderModal');
        const closeBtn = document.getElementById('manualOrderCloseBtn');
        const cancelBtn = document.getElementById('manualOrderCancelBtn');
        const form = document.getElementById('manualOrderForm');
        const submitBtn = document.getElementById('manualOrderSubmitBtn');
        const addItemBtn = document.getElementById('manualAddItemBtn');
        const itemsList = document.getElementById('manualOrderItemsList');
        const totalEl = document.getElementById('manualOrderTotal');

        const rebuildManualOrderTotal = () => {
            if (!totalEl || !itemsList) return;
            const rows = Array.from(itemsList.querySelectorAll('.manual-order-item-row'));
            const total = rows.reduce((sum, row) => {
                const priceInput = row.querySelector('[data-manual-item="price"]');
                const raw = Number(priceInput?.value || 0);
                const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                return sum + safe;
            }, 0);
            totalEl.textContent = `Total: ${total.toFixed(2)} Kč`;
        };

        const appendManualItemRow = (defaults = {}) => {
            if (!itemsList) return;
            const row = document.createElement('div');
            row.className = 'manual-order-item-row';
            row.innerHTML = `
                <div class="manual-order-item-grid">
                    <div class="form-group">
                        <label>Device</label>
                        <input type="text" data-manual-item="device" value="${escapeHtml(String(defaults.device || ''))}" placeholder="phone, tablet, notebook, desktop, other">
                    </div>
                    <div class="form-group">
                        <label>Brand</label>
                        <input type="text" data-manual-item="brand" value="${escapeHtml(String(defaults.brand || ''))}">
                    </div>
                    <div class="form-group">
                        <label>Model</label>
                        <input type="text" data-manual-item="model" value="${escapeHtml(String(defaults.model || ''))}">
                    </div>
                    <div class="form-group">
                        <label>Repair Type</label>
                        <input type="text" data-manual-item="repairType" value="${escapeHtml(String(defaults.repairType || 'manual'))}">
                    </div>
                    <div class="form-group">
                        <label>Repair Name</label>
                        <input type="text" data-manual-item="repairName" value="${escapeHtml(String(defaults.repairName || ''))}" required>
                    </div>
                    <div class="form-group">
                        <label>Price</label>
                        <input type="number" data-manual-item="price" value="${escapeHtml(String(defaults.price || '0'))}" step="0.01" min="0" required>
                    </div>
                </div>
                <div class="manual-order-item-actions">
                    <button type="button" class="btn btn-sm btn-danger" data-manual-item-remove>Remove</button>
                </div>
            `;

            itemsList.appendChild(row);

            row.querySelectorAll('input').forEach((input) => {
                input.addEventListener('input', rebuildManualOrderTotal);
            });

            row.querySelector('[data-manual-item-remove]')?.addEventListener('click', () => {
                row.remove();
                if (!itemsList.querySelector('.manual-order-item-row')) {
                    appendManualItemRow();
                }
                rebuildManualOrderTotal();
            });

            rebuildManualOrderTotal();
        };

        appendManualItemRow();

        modal?.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeManualOrderModal();
            }
        });

        closeBtn?.addEventListener('click', closeManualOrderModal);
        cancelBtn?.addEventListener('click', closeManualOrderModal);
        addItemBtn?.addEventListener('click', () => {
            appendManualItemRow();
        });

        form?.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!submitBtn) return;

            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating...';

            try {
                const items = Array.from(document.querySelectorAll('#manualOrderItemsList .manual-order-item-row'))
                    .map((row) => ({
                        device: String(row.querySelector('[data-manual-item="device"]')?.value || '').trim(),
                        brand: String(row.querySelector('[data-manual-item="brand"]')?.value || '').trim(),
                        model: String(row.querySelector('[data-manual-item="model"]')?.value || '').trim(),
                        repairType: String(row.querySelector('[data-manual-item="repairType"]')?.value || 'manual').trim(),
                        repairName: String(row.querySelector('[data-manual-item="repairName"]')?.value || '').trim(),
                        price: Number(row.querySelector('[data-manual-item="price"]')?.value || 0)
                    }))
                    .filter((item) => item.repairName && Number.isFinite(item.price));

                if (!items.length) {
                    throw new Error('At least one valid item with name and price is required');
                }

                const payload = {
                    customerName: String(document.getElementById('manualCustomerName')?.value || '').trim(),
                    customerEmail: String(document.getElementById('manualCustomerEmail')?.value || '').trim(),
                    customerPhone: String(document.getElementById('manualCustomerPhone')?.value || '').trim(),
                    customerAddress: String(document.getElementById('manualAddress')?.value || '').trim(),
                    customerCity: String(document.getElementById('manualCity')?.value || '').trim(),
                    customerZip: String(document.getElementById('manualZip')?.value || '').trim(),
                    country: String(document.getElementById('manualCountry')?.value || '').trim(),
                    serviceType: String(document.getElementById('manualServiceType')?.value || 'pickup').trim(),
                    status: String(document.getElementById('manualOrderStatus')?.value || 'pending').trim(),
                    notes: String(document.getElementById('manualOrderNotes')?.value || '').trim(),
                    items
                };

                const result = await apiCall('POST', '/orders/admin/manual', payload);
                showToast(`Order created: ${result?.order?.orderNumber || 'OK'}`);
                closeManualOrderModal();
                await renderAdminOrders();
            } catch (error) {
                showToast('Failed to create manual order: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    // ========================================================================
    // MODULE 13: CUSTOM PC BUILDER FUNCTIONS
    // PC parts selection and build creation
    // ========================================================================

    /**
     * Render custom PC builder page
     */
    function renderCustomPCPage() {
        // Hide sidebar initially
        const sidebar = document.querySelector('.custom-pc-sidebar');
        const container = document.querySelector('.custom-pc-container');
        if (sidebar) sidebar.classList.remove('show');
        if (container) container.classList.remove('sidebar-active');

        // Reset current build when entering the page
        currentBuild = {
            buildType: null,
            serverType: null,
            buildStatus: null,
            osOption: null,
            installOption: null,
            haBrand: null,
            haType: null,
            haModel: null,
            haRam: null,
            haStorageType: null,
            haStorageSize: null,
            haCaseRack: null,
            haSwitch: null,
            haInstallOs: null,
            haCluster: null,
            cpuBrand: null, cpu: null, motherboard: null, ram: null,
            storage: null, psu: null, case: null, cooler: null, rack: null
        };
        updateBuildSidebar();
        renderBuildSummary();

        // Render build type first
        renderCustomPCStep('buildType');

        // Attach back button handlers
        const backBtns = {
            'backToBuildType': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.remove('show');
                if (container) container.classList.remove('sidebar-active');
                if (currentBuild.buildType === 'server' && currentBuild.serverType) {
                    renderCustomPCStep('serverType');
                } else {
                    renderCustomPCStep('buildType');
                }
            },
            'backToBuildTypeServer': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.remove('show');
                if (container) container.classList.remove('sidebar-active');
                renderCustomPCStep('buildType');
            },
            'backToServerTypeHa': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.remove('show');
                if (container) container.classList.remove('sidebar-active');
                renderCustomPCStep('serverType');
            },
            'backToHaBrand': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.remove('show');
                if (container) container.classList.remove('sidebar-active');
                renderCustomPCStep('haBrand');
            },
            'backToHaType': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haType');
            },
            'backToHaModel': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haModel');
            },
            'backToHaRam': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haRam');
            },
            'backToHaStorageType': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haStorageType');
            },
            'backToHaStorageSize': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haStorageSize');
            },
            'backToHaCaseRack': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haCaseRack');
            },
            'backToHaSwitch': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('haSwitch');
            },
            'backToCpuBrand': () => {
                // Hide sidebar when going back to brand selection
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.remove('show');
                if (container) container.classList.remove('sidebar-active');
                renderCustomPCStep('cpuBrand');
            },
            'backToCpu': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('cpu');
            },
            'backToMotherboard': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('motherboard');
            },
            'backToRam': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('ram');
            },
            'backToStorage': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('storage');
            },
            'backToPsu': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('psu');
            },
            'backToPsuServer': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('psu');
            },
            'backToCase': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('case');
            },
            'backToRack': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('rack');
            },
            'backToCooler': () => {
                const sidebar = document.querySelector('.custom-pc-sidebar');
                const container = document.querySelector('.custom-pc-container');
                if (sidebar) sidebar.classList.add('show');
                if (container) container.classList.add('sidebar-active');
                renderCustomPCStep('cooler');
            }
        };

        Object.entries(backBtns).forEach(([btnId, handler]) => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = handler;
        });

        const uploadEl = DOM.uploadRef;
        if (uploadEl) {
            uploadEl.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                const img = DOM.previewImage;
                const placeholder = document.querySelector('.preview-placeholder');
                const reader = new FileReader();
                reader.onload = function(ev) {
                    img.src = ev.target.result;
                    img.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            };
        }

        const addBuildToCartBtn = DOM.addBuildToCartBtn;
        if (addBuildToCartBtn) {
            addBuildToCartBtn.onclick = addBuildToCart;
        }

        renderBuildSummary();
    }

    /**
     * Update progress steps display
     */
    function updateCustomPCProgressSteps(step) {
        const progressRoot = document.querySelector('#custompc .progress-steps');
        if (!progressRoot) return;

        const isHomeAssistant = currentBuild.buildType === 'server'
            && (currentBuild.serverType === 'server-home-assistant'
                || ['haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haOther'].includes(step));
        const isServerFlow = currentBuild.buildType === 'server' || step === 'serverType';

        const customSteps = ['buildType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'osOption'];
        const customLabels = ['Type', 'Brand', 'CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'OS'];

        const serverSteps = ['buildType', 'serverType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack', 'other'];
        const serverLabels = ['Type', 'Server Type', 'Brand', 'CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Rack', 'Other'];

        const haSteps = ['buildType', 'serverType', 'haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haOther'];
        const haLabels = ['Type', 'Server Type', 'Brand', 'Type', 'Model', 'RAM', 'Storage', 'Size', 'Case/Rack', 'Switch', 'Other'];

        const steps = isHomeAssistant ? haSteps : (isServerFlow ? serverSteps : customSteps);
        const labels = isHomeAssistant ? haLabels : (isServerFlow ? serverLabels : customLabels);
        const stepIndex = steps.indexOf(step);
        if (stepIndex === -1) return;

        const items = Array.from(progressRoot.querySelectorAll('.step-item'));
        const lines = Array.from(progressRoot.querySelectorAll('.step-line'));

        items.forEach((item, idx) => {
            if (idx < steps.length) {
                item.style.display = '';
                const label = item.querySelector('span');
                if (label) label.textContent = labels[idx];
            } else {
                item.style.display = 'none';
            }
        });

        lines.forEach((line, idx) => {
            line.style.display = idx < steps.length - 1 ? '' : 'none';
        });

        const visibleItems = items.filter(item => item.style.display !== 'none');
        visibleItems.forEach((item, idx) => {
            const stepNum = idx + 1;
            item.classList.remove('active', 'completed');
            if (idx < stepIndex) {
                item.classList.add('completed');
                item.querySelector('.step-circle').textContent = '';
            } else if (idx === stepIndex) {
                item.classList.add('active');
                item.querySelector('.step-circle').textContent = stepNum;
            } else {
                item.querySelector('.step-circle').textContent = stepNum;
            }
        });

        const visibleLines = lines.filter(line => line.style.display !== 'none');
        visibleLines.forEach((line, idx) => {
            line.classList.toggle('active', idx < stepIndex);
        });
    }

    /**
     * Show/hide service steps for custom PC
     */
    function showCustomPCStep(step) {
        const stepMap = {
            'buildType': 'buildTypeStep',
            'serverType': 'serverTypeStep',
            'cpuBrand': 'cpuBrandStep',
            'cpu': 'cpuStep',
            'motherboard': 'motherboardStep',
            'ram': 'ramStep',
            'storage': 'storageStep',
            'psu': 'psuStep',
            'case': 'caseStep',
            'cooler': 'coolerStep',
            'osOption': 'osOptionStep',
            'rack': 'rackStep',
            'other': 'otherStep',
            'haBrand': 'haBrandStep',
            'haType': 'haTypeStep',
            'haModel': 'haModelStep',
            'haRam': 'haRamStep',
            'haStorageType': 'haStorageTypeStep',
            'haStorageSize': 'haStorageSizeStep',
            'haCaseRack': 'haCaseRackStep',
            'haSwitch': 'haSwitchStep',
            'haOther': 'haOtherStep'
        };

        document.querySelectorAll('#custompc .service-step').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });

        const target = document.getElementById(stepMap[step]);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block';
        }

        updateCustomPCProgressSteps(step);
    }

    /**
     * Render custom PC step (CPU Brand, CPU, Motherboard, RAM, etc.)
     * @param {string} step - Current step name
     */
    function renderCustomPCStep(step) {
        let items = [];
        let gridId = '';
        const stepsWithDetails = new Set(['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler']);
        const progress = document.getElementById('customPcProgress');
        if (progress) {
            progress.classList.toggle('hidden', step === 'buildType');
        }

        if (step === 'buildType') {
            items = customPCParts.buildType;
            gridId = 'buildTypeGrid';
        } else if (step === 'serverType') {
            items = customPCParts.serverType;
            gridId = 'serverTypeGrid';
        } else if (step === 'haBrand') {
            items = customPCParts.haBrand;
            gridId = 'haBrandGrid';
        } else if (step === 'haType') {
            items = customPCParts.haType;
            gridId = 'haTypeGrid';
        } else if (step === 'haModel') {
            items = currentBuild.haBrand === 'nvidia' ? customPCParts.haModelNvidia : customPCParts.haModelRaspberry;
            gridId = 'haModelGrid';
        } else if (step === 'haRam') {
            items = currentBuild.haBrand === 'nvidia' ? customPCParts.haRamNvidia : customPCParts.haRamRaspberry;
            gridId = 'haRamGrid';
        } else if (step === 'haStorageType') {
            items = currentBuild.haBrand === 'nvidia' ? customPCParts.haStorageTypeNvidia : customPCParts.haStorageTypeRaspberry;
            gridId = 'haStorageTypeGrid';
        } else if (step === 'haStorageSize') {
            const typeId = currentBuild.haStorageType || '';
            items = typeId === 'sd-card' ? customPCParts.haStorageSizeSd : customPCParts.haStorageSizeSsd;
            gridId = 'haStorageSizeGrid';
        } else if (step === 'haCaseRack') {
            items = currentBuild.haType === 'rack' ? customPCParts.rack : customPCParts.haCase;
            gridId = 'haCaseRackGrid';
        } else if (step === 'haSwitch') {
            items = customPCParts.haSwitch;
            gridId = 'haSwitchGrid';
        } else if (step === 'haOther') {
            const installGrid = document.getElementById('haInstallOsGrid');
            const clusterGrid = document.getElementById('haClusterGrid');

            if (installGrid) {
                const installItems = filterActiveItems(customPCParts.haInstallOs);
                installGrid.innerHTML = installItems.map(item => `
                    <div class="brand-card" data-step="haInstallOs" data-id="${item.id}">
                        <h3>${item.name}</h3>
                    </div>
                `).join('');
                installGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        currentBuild.haInstallOs = card.dataset.id;
                        installGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        renderBuildSummary();
                        updateBuildSidebar();
                        if (currentBuild.haInstallOs && (currentBuild.haBrand !== 'raspberry' || currentBuild.haCluster)) {
                            showBuildSummary();
                        }
                    });
                });
            }

            if (clusterGrid) {
                if (currentBuild.haBrand === 'raspberry') {
                    clusterGrid.style.display = '';
                    const clusterItems = filterActiveItems(customPCParts.haCluster);
                    clusterGrid.innerHTML = clusterItems.map(item => `
                        <div class="brand-card" data-step="haCluster" data-id="${item.id}">
                            <h3>${item.name}</h3>
                        </div>
                    `).join('');
                    clusterGrid.querySelectorAll('.brand-card').forEach(card => {
                        card.addEventListener('click', () => {
                            currentBuild.haCluster = card.dataset.id;
                            clusterGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                            card.classList.add('active');
                            renderBuildSummary();
                            updateBuildSidebar();
                            if (currentBuild.haInstallOs) {
                                showBuildSummary();
                            }
                        });
                    });
                } else {
                    clusterGrid.style.display = 'none';
                    clusterGrid.innerHTML = '';
                    currentBuild.haCluster = null;
                }
            }

            showCustomPCStep(step);
            return;
        } else if (step === 'rack') {
            items = customPCParts.rack;
            gridId = 'rackGrid';
        } else if (step === 'osOption') {
            const osGrid = document.getElementById('customOsOptionGrid');
            const osDescriptionEl = document.getElementById('customPCOsOptionDescriptionStep');
            const osTitleEl = document.getElementById('customOsStepTitle');
            const osSubtitleEl = document.getElementById('customOsStepSubtitle');
            const backLabelEl = document.getElementById('backToCoolerLabel');

            if (osTitleEl) osTitleEl.textContent = t('Select OS');
            if (osSubtitleEl) osSubtitleEl.textContent = t('Choose operating system preference');
            if (backLabelEl) backLabelEl.textContent = t('Back');

            if (osDescriptionEl) {
                const text = String(customPCParts.osOptionDescription || '').trim();
                osDescriptionEl.textContent = text || t('Choose whether you want the system delivered with an operating system.');
            }

            if (osGrid) {
                const osItems = filterActiveItems(customPCParts.osOption);
                osGrid.innerHTML = osItems.map(item => `
                    <div class="brand-card" data-step="osOption" data-id="${item.id}">
                        <h3>${item.name}</h3>
                    </div>
                `).join('');
                if (currentBuild.osOption) {
                    osGrid.querySelectorAll('.brand-card').forEach(card => {
                        if (card.dataset.id === currentBuild.osOption) {
                            card.classList.add('active');
                        }
                    });
                }
                osGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        currentBuild.osOption = card.dataset.id;
                        osGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        renderBuildSummary();
                        updateBuildSidebar();
                        showBuildSummary();
                    });
                });
            }

            showCustomPCStep(step);
            return;
        } else if (step === 'other') {
            const buildGrid = document.getElementById('buildStatusGrid');
            const osGrid = document.getElementById('osOptionGrid');
            const installGrid = document.getElementById('installOptionGrid');
            const osDescriptionEl = document.getElementById('customPCOsOptionDescription');
            const isServerBuild = currentBuild.buildType === 'server';
            const buildStatusHeader = buildGrid ? buildGrid.previousElementSibling : null;
            const installHeader = installGrid ? installGrid.previousElementSibling : null;

            if (buildStatusHeader) buildStatusHeader.style.display = isServerBuild ? '' : 'none';
            if (buildGrid) buildGrid.style.display = isServerBuild ? '' : 'none';
            if (installHeader) installHeader.style.display = isServerBuild ? '' : 'none';
            if (installGrid) installGrid.style.display = isServerBuild ? '' : 'none';
            if (osDescriptionEl) {
                const text = String(customPCParts.osOptionDescription || '').trim();
                osDescriptionEl.textContent = text || t('Choose whether you want the system delivered with an operating system.');
            }

            if (buildGrid && isServerBuild) {
                const buildItems = filterActiveItems(customPCParts.buildStatus);
                buildGrid.innerHTML = buildItems.map(item => `
                    <div class="brand-card" data-step="buildStatus" data-id="${item.id}">
                        <h3>${item.name}</h3>
                    </div>
                `).join('');
                if (currentBuild.buildStatus) {
                    buildGrid.querySelectorAll('.brand-card').forEach(card => {
                        if (card.dataset.id === currentBuild.buildStatus) {
                            card.classList.add('active');
                        }
                    });
                }
                buildGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        currentBuild.buildStatus = card.dataset.id;
                        buildGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        renderBuildSummary();
                        updateBuildSidebar();
                        if (currentBuild.buildStatus && currentBuild.osOption && currentBuild.installOption) {
                            showBuildSummary();
                        }
                    });
                });
            }

            if (osGrid) {
                const osItems = filterActiveItems(customPCParts.osOption);
                osGrid.innerHTML = osItems.map(item => `
                    <div class="brand-card" data-step="osOption" data-id="${item.id}">
                        <h3>${item.name}</h3>
                    </div>
                `).join('');
                if (currentBuild.osOption) {
                    osGrid.querySelectorAll('.brand-card').forEach(card => {
                        if (card.dataset.id === currentBuild.osOption) {
                            card.classList.add('active');
                        }
                    });
                }
                osGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        currentBuild.osOption = card.dataset.id;
                        osGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        renderBuildSummary();
                        updateBuildSidebar();
                        if (!isServerBuild || (currentBuild.buildStatus && currentBuild.installOption)) {
                            showBuildSummary();
                        }
                    });
                });
            }

            if (installGrid && isServerBuild) {
                const installItems = filterActiveItems(customPCParts.installOption);
                installGrid.innerHTML = installItems.map(item => `
                    <div class="brand-card" data-step="installOption" data-id="${item.id}">
                        <h3>${item.name}</h3>
                    </div>
                `).join('');
                if (currentBuild.installOption) {
                    installGrid.querySelectorAll('.brand-card').forEach(card => {
                        if (card.dataset.id === currentBuild.installOption) {
                            card.classList.add('active');
                        }
                    });
                }
                installGrid.querySelectorAll('.brand-card').forEach(card => {
                    card.addEventListener('click', () => {
                        currentBuild.installOption = card.dataset.id;
                        installGrid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                        card.classList.add('active');
                        renderBuildSummary();
                        updateBuildSidebar();
                        if (currentBuild.buildStatus && currentBuild.osOption && currentBuild.installOption) {
                            showBuildSummary();
                        }
                    });
                });
            }

            showCustomPCStep(step);
            return;
        } else if (step === 'cpuBrand') {
            items = customPCParts.cpuBrand;
            gridId = 'cpuBrandGrid';
        } else if (step === 'cpu') {
            const brand = currentBuild.cpuBrand;
            items = customPCParts[brand] || [];
            gridId = 'cpuGrid';
            document.getElementById('cpuBrandName').textContent = brand ? brand.toUpperCase() : 'CPU';
        } else if (step === 'motherboard') {
            const brand = currentBuild.cpuBrand;
            const key = `motherboard_${brand}`;
            items = customPCParts[key] || [];
            gridId = 'motherboardGrid';
            document.getElementById('motherboardBrandName').textContent = brand ? brand.toUpperCase() : 'Motherboard';
        } else {
            items = customPCParts[step] || [];
            gridId = step + 'Grid';
        }

        items = filterActiveItems(items);

        // Render items as cards
        const grid = document.getElementById(gridId);
        if (grid) {
            grid.innerHTML = items.map(item => {
                const iconMap = {
                    buildType: customBuildIcons[item.id],
                    serverType: customBuildIcons.server,
                    haBrand: customBuildIcons[item.id],
                    haType: customBuildIcons[item.id]
                };
                const iconHtml = iconMap[step] ? `<div class="card-icon">${iconMap[step]}</div>` : '';

                // For build type and CPU Brand steps, only show name
                if (step === 'buildType' || step === 'serverType' || step === 'cpuBrand' || step === 'haBrand' || step === 'haType' || step === 'haStorageType') {
                    return `<div class="brand-card" data-step="${step}" data-id="${item.id}">
                        ${iconHtml}
                        <h3>${item.name}</h3>
                    </div>`;
                }
                // For other steps, show name and price
                const photo = (stepsWithDetails.has(step) && item.images && item.images.length)
                    ? `<div class="part-media"><img src="${item.images[0]}" alt="${item.name}" loading="lazy" decoding="async"></div>`
                    : '';
                const detailsBtn = (stepsWithDetails.has(step) && item.images && item.images.length)
                    ? `<div class="part-actions"><button class="btn btn-secondary btn-sm details-btn" data-id="${item.id}" data-step="${step}">Details</button></div>`
                    : '';
                return `<div class="brand-card" data-step="${step}" data-id="${item.id}">
                    ${photo}
                    ${iconHtml}
                    <h3>${item.name}</h3>
                    <p class="part-price">${formatCurrency(item.price)}</p>
                    ${detailsBtn}
                </div>`;
            }).join('');

            const getSelectedId = (stepKey) => {
                const map = {
                    buildType: currentBuild.buildType,
                    serverType: currentBuild.serverType,
                    buildStatus: currentBuild.buildStatus,
                    osOption: currentBuild.osOption,
                    installOption: currentBuild.installOption,
                    cpuBrand: currentBuild.cpuBrand,
                    cpu: currentBuild.cpu,
                    motherboard: currentBuild.motherboard,
                    ram: currentBuild.ram,
                    storage: currentBuild.storage,
                    psu: currentBuild.psu,
                    case: currentBuild.case,
                    cooler: currentBuild.cooler,
                    rack: currentBuild.rack,
                    haBrand: currentBuild.haBrand,
                    haType: currentBuild.haType,
                    haModel: currentBuild.haModel,
                    haRam: currentBuild.haRam,
                    haStorageType: currentBuild.haStorageType,
                    haStorageSize: currentBuild.haStorageSize,
                    haCaseRack: currentBuild.haCaseRack,
                    haSwitch: currentBuild.haSwitch
                };
                return map[stepKey] || null;
            };

            const selectedId = getSelectedId(step);
            if (selectedId) {
                grid.querySelectorAll('.brand-card').forEach(card => {
                    if (card.dataset.id === selectedId) {
                        card.classList.add('active');
                    }
                });
            }

            grid.querySelectorAll('.brand-card').forEach(card => {
                card.addEventListener('click', () => {
                    grid.querySelectorAll('.brand-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    selectCustomPCPart(step, card.dataset.id);
                });
            });

            grid.querySelectorAll('.details-btn').forEach(btn => {
                btn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    openPartDetails(btn.dataset.step, btn.dataset.id);
                });
            });
        }

        showCustomPCStep(step);
    }

    /**
     * Select a custom PC part and advance to next step
     */
    function selectCustomPCPart(step, itemId) {
        const isHomeAssistant = currentBuild.buildType === 'server'
            && (currentBuild.serverType === 'server-home-assistant'
                || ['haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haOther'].includes(step));
        const allSteps = isHomeAssistant
            ? ['buildType', 'serverType', 'haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haOther']
            : (currentBuild.buildType === 'server'
                ? ['buildType', 'serverType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack', 'other']
                : ['buildType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'osOption']);
        const stepIndex = allSteps.indexOf(step);

        if (step === 'buildType') {
            currentBuild.buildType = itemId;
            currentBuild.serverType = null;
            currentBuild.buildStatus = null;
            currentBuild.osOption = null;
            currentBuild.installOption = null;
            currentBuild.haBrand = null;
            currentBuild.haType = null;
            currentBuild.haModel = null;
            currentBuild.haRam = null;
            currentBuild.haStorageType = null;
            currentBuild.haStorageSize = null;
            currentBuild.haCaseRack = null;
            currentBuild.haSwitch = null;
            currentBuild.haInstallOs = null;
            currentBuild.haCluster = null;
            if (itemId === 'server') {
                renderCustomPCStep('serverType');
            } else {
                renderCustomPCStep('cpuBrand');
            }
        } else if (step === 'serverType') {
            currentBuild.serverType = itemId;
            currentBuild.buildStatus = null;
            currentBuild.osOption = null;
            currentBuild.installOption = null;
            currentBuild.haBrand = null;
            currentBuild.haType = null;
            currentBuild.haModel = null;
            currentBuild.haRam = null;
            currentBuild.haStorageType = null;
            currentBuild.haStorageSize = null;
            currentBuild.haCaseRack = null;
            currentBuild.haSwitch = null;
            currentBuild.haInstallOs = null;
            currentBuild.haCluster = null;
            if (itemId === 'server-home-assistant') {
                renderCustomPCStep('haBrand');
            } else {
                renderCustomPCStep('cpuBrand');
            }
        } else if (step === 'haBrand') {
            currentBuild.haBrand = itemId;
            currentBuild.haType = null;
            currentBuild.haModel = null;
            currentBuild.haRam = null;
            currentBuild.haStorageType = null;
            currentBuild.haStorageSize = null;
            currentBuild.haCaseRack = null;
            currentBuild.haSwitch = null;
            currentBuild.haInstallOs = null;
            currentBuild.haCluster = null;
            renderCustomPCStep('haType');
        } else if (step === 'haType') {
            currentBuild.haType = itemId;
            const sidebar = document.querySelector('.custom-pc-sidebar');
            const container = document.querySelector('.custom-pc-container');
            if (sidebar) sidebar.classList.add('show');
            if (container) container.classList.add('sidebar-active');
            renderCustomPCStep('haModel');
        } else if (step === 'haModel') {
            currentBuild.haModel = itemId;
            renderCustomPCStep('haRam');
        } else if (step === 'haRam') {
            currentBuild.haRam = itemId;
            renderCustomPCStep('haStorageType');
        } else if (step === 'haStorageType') {
            currentBuild.haStorageType = itemId;
            currentBuild.haStorageSize = null;
            renderCustomPCStep('haStorageSize');
        } else if (step === 'haStorageSize') {
            currentBuild.haStorageSize = itemId;
            renderCustomPCStep('haCaseRack');
        } else if (step === 'haCaseRack') {
            currentBuild.haCaseRack = itemId;
            renderCustomPCStep('haSwitch');
        } else if (step === 'haSwitch') {
            currentBuild.haSwitch = itemId;
            renderCustomPCStep('haOther');
        } else if (step === 'cpuBrand') {
            currentBuild.cpuBrand = itemId;
            // Show sidebar when moving to CPU selection
            const sidebar = document.querySelector('.custom-pc-sidebar');
            const container = document.querySelector('.custom-pc-container');
            if (sidebar) sidebar.classList.add('show');
            if (container) container.classList.add('sidebar-active');
            renderCustomPCStep('cpu');
        } else if (step === 'cpu') {
            currentBuild.cpu = itemId;
            renderCustomPCStep('motherboard');
        } else if (step === 'rack') {
            currentBuild.rack = itemId;
            renderCustomPCStep('other');
        } else {
            currentBuild[step] = itemId;
            // Advance to next step
            if (stepIndex < allSteps.length - 1) {
                renderCustomPCStep(allSteps[stepIndex + 1]);
            } else {
                showBuildSummary();
            }
        }

        renderBuildSummary();
        updateBuildSidebar();
    }

    /**
     * Update the build summary sidebar
     */
    function updateBuildSidebar() {
        const sidebar = document.getElementById('summarySidebar');
        const totalSpan = document.getElementById('sidebarTotal');
        
        const isHomeAssistant = currentBuild.buildType === 'server'
            && currentBuild.serverType === 'server-home-assistant';
        const allSteps = isHomeAssistant
            ? ['buildType', 'serverType', 'haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haInstallOs', 'haCluster']
            : (currentBuild.buildType === 'server'
                ? ['buildType', 'serverType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack', 'buildStatus', 'osOption', 'installOption']
                : ['buildType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'osOption']);
        const stepLabels = isHomeAssistant
            ? ['Type', 'Server Type', 'Brand', 'Type', 'Model', 'RAM', 'Storage Type', 'Storage Size', 'Case/Rack', 'Switch', 'Install OS', 'Cluster']
            : (currentBuild.buildType === 'server'
                ? ['Type', 'Server Type', 'Brand', 'CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Rack', 'Build', 'OS', 'Install']
                : ['Type', 'Brand', 'CPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler', 'OS']);
        
        let items = [];
        let total = 0;

        allSteps.forEach((step, index) => {
            if (currentBuild[step]) {
                const info = getCustomPCPartInfo(step, currentBuild[step]);
                if (info) {
                    // For type and brand, show name only (no price)
                    if (step === 'buildType'
                        || step === 'serverType'
                        || step === 'cpuBrand'
                        || step === 'buildStatus'
                        || step === 'osOption'
                        || step === 'installOption'
                        || step === 'haBrand'
                        || step === 'haType'
                        || step === 'haStorageType'
                        || step === 'haInstallOs'
                        || step === 'haCluster') {
                        items.push(`<div class="summary-item">
                            <span class="summary-label">${stepLabels[index]}:</span>
                            <span class="summary-value">${info.name}</span>
                        </div>`);
                    } else {
                        items.push(`<div class="summary-item">
                            <span class="summary-label">${stepLabels[index]}:</span>
                            <span class="summary-value">${info.name}</span>
                            <span class="summary-price">$${info.price}</span>
                        </div>`);
                        total += parseInt(info.price) || 0;
                    }
                }
            }
        });

        if (items.length === 0) {
            sidebar.innerHTML = '<div class="summary-item empty">No components selected</div>';
            totalSpan.textContent = formatCurrency(0);
        } else {
            sidebar.innerHTML = items.join('');
            totalSpan.textContent = formatCurrency(total);
        }
    }

    /**
     * Show the build summary after all steps complete
     */
    function showBuildSummary() {
        document.querySelectorAll('#custompc .service-step').forEach(el => {
            el.classList.remove('active');
            el.style.display = 'none';
        });

        const summaryStep = document.getElementById('summaryStep');
        if (summaryStep) {
            summaryStep.classList.add('active');
            summaryStep.style.display = 'block';
        }

        const lastStep = currentBuild.buildType === 'server'
            ? (currentBuild.serverType === 'server-home-assistant' ? 'haOther' : 'other')
            : 'osOption';
        updateCustomPCProgressSteps(lastStep);
    }

    /**
     * Get part name and price by ID
     */
    function getCustomPCPartInfo(step, id) {
        let list = [];
        if (step === 'buildType') {
            list = customPCParts.buildType;
        } else if (step === 'serverType') {
            list = customPCParts.serverType;
        } else if (step === 'buildStatus') {
            list = customPCParts.buildStatus;
        } else if (step === 'osOption') {
            list = customPCParts.osOption;
        } else if (step === 'installOption') {
            list = customPCParts.installOption;
        } else if (step === 'haBrand') {
            list = customPCParts.haBrand;
        } else if (step === 'haType') {
            list = customPCParts.haType;
        } else if (step === 'haModel') {
            list = currentBuild.haBrand === 'nvidia' ? customPCParts.haModelNvidia : customPCParts.haModelRaspberry;
        } else if (step === 'haRam') {
            list = currentBuild.haBrand === 'nvidia' ? customPCParts.haRamNvidia : customPCParts.haRamRaspberry;
        } else if (step === 'haStorageType') {
            list = currentBuild.haBrand === 'nvidia' ? customPCParts.haStorageTypeNvidia : customPCParts.haStorageTypeRaspberry;
        } else if (step === 'haStorageSize') {
            list = currentBuild.haStorageType === 'sd-card' ? customPCParts.haStorageSizeSd : customPCParts.haStorageSizeSsd;
        } else if (step === 'haCaseRack') {
            list = currentBuild.haType === 'rack' ? customPCParts.rack : customPCParts.haCase;
        } else if (step === 'haSwitch') {
            list = customPCParts.haSwitch;
        } else if (step === 'haInstallOs') {
            list = customPCParts.haInstallOs;
        } else if (step === 'haCluster') {
            list = customPCParts.haCluster;
        } else if (step === 'rack') {
            list = customPCParts.rack;
        } else if (step === 'cpuBrand') {
            list = customPCParts.cpuBrand;
        } else if (step === 'cpu') {
            const brand = currentBuild.cpuBrand;
            list = customPCParts[brand] || [];
        } else if (step === 'motherboard') {
            const brand = currentBuild.cpuBrand;
            list = customPCParts[`motherboard_${brand}`] || [];
        } else {
            list = customPCParts[step] || [];
        }
        return list.find(p => p.id === id);
    }

    /**
     * Render current PC build summary with total cost
     */
    function renderBuildSummary() {
        const list = DOM.buildList;
        const total = DOM.buildTotal;

        const isHomeAssistant = currentBuild.buildType === 'server'
            && currentBuild.serverType === 'server-home-assistant';

        if (list) {
            const stepKeys = isHomeAssistant
                ? ['buildType', 'serverType', 'haBrand', 'haType', 'haModel', 'haRam', 'haStorageType', 'haStorageSize', 'haCaseRack', 'haSwitch', 'haInstallOs', 'haCluster']
                : (currentBuild.buildType === 'server'
                    ? ['buildType', 'serverType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack', 'buildStatus', 'osOption', 'installOption']
                    : ['buildType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'osOption']);
            const labelMap = {
                buildType: 'Build Type',
                serverType: 'Server Type',
                buildStatus: 'Build',
                osOption: 'OS',
                installOption: 'Install',
                haBrand: 'Brand',
                haType: 'Type',
                haModel: 'Model',
                haRam: 'RAM',
                haStorageType: 'Storage Type',
                haStorageSize: 'Storage Size',
                haCaseRack: 'Case/Rack',
                haSwitch: 'Switch',
                haInstallOs: 'Install OS',
                haCluster: 'Cluster',
                cpuBrand: 'CPU Brand'
            };

            list.innerHTML = stepKeys.map(k => {
                const id = currentBuild[k];
                const part = id ? getCustomPCPartInfo(k, id) : null;
                const displayName = labelMap[k] || (k.charAt(0).toUpperCase() + k.slice(1));
                const price = part && typeof part.price === 'number' ? `<span>${formatCurrency(part.price)}</span>` : '';
                return `<li data-key="${k}">${displayName}: <strong>${part ? part.name : '—'}</strong> ${price}</li>`;
            }).join('');
        }

        let buildTotal = 0;
        const stepKeys = isHomeAssistant
            ? ['haModel', 'haRam', 'haStorageSize', 'haCaseRack', 'haSwitch']
            : (currentBuild.buildType === 'server'
                ? ['buildType', 'serverType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack', 'buildStatus', 'osOption', 'installOption']
                : ['buildType', 'cpuBrand', 'cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler', 'osOption']);
        stepKeys.forEach(k => {
            const id = currentBuild[k];
            if (id) {
                const part = getCustomPCPartInfo(k, id);
                if (part && part.price) buildTotal += part.price;
            }
        });
        
        if (total) {
            total.textContent = formatCurrency(buildTotal);
        }
    }

    /**
     * Open the part details modal with specs and gallery
     */
    function openPartDetails(step, id) {
        const item = getCustomPCPartInfo(step, id);
        if (!item) return;

        const modal = document.getElementById('partDetailsModal');
        const titleEl = document.getElementById('partDetailsTitle');
        const priceEl = document.getElementById('partDetailsPrice');
        const mainImg = document.getElementById('partDetailsMainImage');
        const thumbs = document.getElementById('partDetailsThumbs');
        const thumbsPrev = document.getElementById('partThumbsPrev');
        const thumbsNext = document.getElementById('partThumbsNext');
        const specs = document.getElementById('partDetailsSpecs');

        if (!modal || !titleEl || !priceEl || !mainImg || !thumbs || !specs) return;

        titleEl.textContent = item.name || 'Part Details';
        priceEl.textContent = typeof item.price === 'number' ? formatCurrency(item.price) : '';

        const images = item.images && item.images.length ? item.images : [];
        mainImg.src = images[0] || '';
        mainImg.alt = item.name || 'Part image';

        thumbs.innerHTML = images.map((src, idx) => {
            const active = idx === 0 ? 'active' : '';
            return `<img src="${src}" alt="${item.name || 'Part'}" class="${active}" data-src="${src}" loading="lazy" decoding="async">`;
        }).join('');

        if (thumbsPrev && thumbsNext) {
            const showArrows = images.length > 4;
            thumbsPrev.style.display = showArrows ? 'inline-flex' : 'none';
            thumbsNext.style.display = showArrows ? 'inline-flex' : 'none';
        }

        thumbs.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => {
                thumbs.querySelectorAll('img').forEach(i => i.classList.remove('active'));
                img.classList.add('active');
                mainImg.src = img.dataset.src;
            });
        });

        if (thumbsPrev && thumbsNext) {
            thumbsPrev.onclick = () => {
                thumbs.scrollBy({ left: -240, behavior: 'smooth' });
            };
            thumbsNext.onclick = () => {
                thumbs.scrollBy({ left: 240, behavior: 'smooth' });
            };
        }

        const specList = Array.isArray(item.specs) ? item.specs : [];
        specs.innerHTML = specList.length
            ? specList.map(s => `<li>${escapeHtml(s)}</li>`).join('')
            : '<li>No specs available yet.</li>';

        modal.classList.remove('hidden');
        modal.style.display = '';
    }

    function closePartDetails() {
        const modal = document.getElementById('partDetailsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function openTermsModal() {
        const modal = document.getElementById('termsModal');
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.style.display = '';
    }

    function closeTermsModal() {
        const modal = document.getElementById('termsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    function closeOrderDetails() {
        const modal = document.getElementById('orderDetailsModal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    /**
     * Add custom PC build to cart
     */
    async function addBuildToCart() {
        const buildTypeInfo = currentBuild.buildType ? getCustomPCPartInfo('buildType', currentBuild.buildType) : null;
        const serverTypeInfo = currentBuild.serverType ? getCustomPCPartInfo('serverType', currentBuild.serverType) : null;
        const buildStatusInfo = currentBuild.buildStatus ? getCustomPCPartInfo('buildStatus', currentBuild.buildStatus) : null;
        const osInfo = currentBuild.osOption ? getCustomPCPartInfo('osOption', currentBuild.osOption) : null;
        const installInfo = currentBuild.installOption ? getCustomPCPartInfo('installOption', currentBuild.installOption) : null;
        const brandInfo = currentBuild.cpuBrand ? getCustomPCPartInfo('cpuBrand', currentBuild.cpuBrand) : null;
        const isHomeAssistant = currentBuild.buildType === 'server'
            && currentBuild.serverType === 'server-home-assistant';

        if (!buildTypeInfo) {
            showToast('Please select build type first');
            return;
        }

        if (currentBuild.buildType === 'server' && !serverTypeInfo) {
            showToast('Please select a server type');
            return;
        }

        if (isHomeAssistant) {
            if (!currentBuild.haBrand || !currentBuild.haType || !currentBuild.haModel || !currentBuild.haRam
                || !currentBuild.haStorageType || !currentBuild.haStorageSize || !currentBuild.haCaseRack || !currentBuild.haSwitch
                || !currentBuild.haInstallOs || (currentBuild.haBrand === 'raspberry' && !currentBuild.haCluster)) {
                showToast('Please complete the Home Assistant build selections');
                return;
            }
        } else {
            if (!brandInfo) {
                showToast('Please select build type and brand first');
                return;
            }
            if (currentBuild.buildType === 'server' && (!buildStatusInfo || !osInfo || !installInfo)) {
                showToast('Please select build status, OS, and installation');
                return;
            }
            if (currentBuild.buildType !== 'server' && !osInfo) {
                showToast('Please select OS option');
                return;
            }
        }

        const parts = isHomeAssistant
            ? ['haModel', 'haRam', 'haStorageSize', 'haCaseRack', 'haSwitch']
            : (currentBuild.buildType === 'server'
                ? ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'rack']
                : ['cpu', 'motherboard', 'ram', 'storage', 'psu', 'case', 'cooler']);
        const total = parts.reduce((sum, key) => {
            const id = currentBuild[key];
            const part = id ? getCustomPCPartInfo(key, id) : null;
            return sum + (part && part.price ? part.price : 0);
        }, 0);

        if (total <= 0) {
            showToast('Please complete the build before adding to cart');
            return;
        }

        const partLabels = {
            cpu: 'CPU',
            motherboard: 'Motherboard',
            ram: 'RAM',
            storage: 'Storage',
            psu: 'PSU',
            case: 'Case',
            cooler: 'Cooler',
            rack: 'Rack',
            haModel: 'Model',
            haRam: 'RAM',
            haStorageSize: 'Storage',
            haCaseRack: 'Case/Rack',
            haSwitch: 'Switch'
        };
        const partsSummary = parts.map(key => {
            const id = currentBuild[key];
            const part = id ? getCustomPCPartInfo(key, id) : null;
            return part ? `${partLabels[key]}: ${part.name}` : null;
        }).filter(Boolean).join(', ');

        const extras = [];
        if (isHomeAssistant) {
            const haBrandInfo = getCustomPCPartInfo('haBrand', currentBuild.haBrand);
            const haTypeInfo = getCustomPCPartInfo('haType', currentBuild.haType);
            const haStorageTypeInfo = getCustomPCPartInfo('haStorageType', currentBuild.haStorageType);
            const haInstallInfo = getCustomPCPartInfo('haInstallOs', currentBuild.haInstallOs);
            const haClusterInfo = currentBuild.haCluster ? getCustomPCPartInfo('haCluster', currentBuild.haCluster) : null;
            if (haBrandInfo) extras.push(`Brand: ${haBrandInfo.name}`);
            if (haTypeInfo) extras.push(`Type: ${haTypeInfo.name}`);
            if (haStorageTypeInfo) extras.push(`Storage Type: ${haStorageTypeInfo.name}`);
            if (haInstallInfo) extras.push(`Install: ${haInstallInfo.name}`);
            if (haClusterInfo) extras.push(`Cluster: ${haClusterInfo.name}`);
        } else {
            if (osInfo) extras.push(`OS: ${osInfo.name}`);
            if (buildStatusInfo) extras.push(`Build: ${buildStatusInfo.name}`);
            if (installInfo) extras.push(`Install: ${installInfo.name}`);
        }
        const fullSummary = [partsSummary, extras.join(' | ')].filter(Boolean).join(' | ');

        const buildLabel = buildTypeInfo.name + (serverTypeInfo ? ` (${serverTypeInfo.name})` : '');
        const modelValue = `${buildLabel}${fullSummary ? ' | ' + fullSummary : ''}`;

        const haBrandInfo = isHomeAssistant ? getCustomPCPartInfo('haBrand', currentBuild.haBrand) : null;
        const cartPayload = {
            device: 'custompc',
            deviceName: 'Custom PC',
            brand: isHomeAssistant ? (haBrandInfo ? haBrandInfo.name : 'Home Assistant') : brandInfo.name,
            brandName: isHomeAssistant ? (haBrandInfo ? haBrandInfo.name : 'Home Assistant') : brandInfo.name,
            model: modelValue,
            repairType: 'custom_build',
            repairName: isHomeAssistant ? 'Home Assistant Server Build' : 'Custom PC Build',
            repairDesc: fullSummary,
            price: total
        };

        try {
            if (!Storage.getToken()) {
                Storage.cart.push({ id: Date.now(), ...cartPayload });
                await Storage.saveCart();
                await updateCartCount();
                showToast('Custom build added to cart');
                return;
            }

            await apiCall('POST', '/cart', {
                device: cartPayload.device,
                deviceName: cartPayload.deviceName,
                brand: cartPayload.brand,
                brandName: cartPayload.brandName,
                model: cartPayload.model,
                repairType: cartPayload.repairType,
                repairName: cartPayload.repairName,
                repairDesc: cartPayload.repairDesc,
                price: cartPayload.price
            });

            await Storage.loadCart();
            await updateCartCount();
            showToast('Custom build added to cart');
        } catch (error) {
            console.error('Error adding build to cart:', error);
            showToast(error.message || 'Failed to add build to cart');
        }
    }

    // ========================================================================
    // MODULE 14: GLOBAL WINDOW FUNCTIONS
    // Export functions to window scope for HTML onclick handlers
    // ========================================================================

    window.showPage = showPage;
    window.t = t;
    window.editOrderStatus = editOrderStatus;
    window.closeStatusModal = closeStatusModal;
    window.saveOrderStatus = saveOrderStatus;
    window.deleteOrder = deleteOrder;
    window.printInvoiceForOrder = printInvoiceForOrder;
    window.openCustomInvoiceModal = openCustomInvoiceModal;
    window.closeCustomInvoiceModal = closeCustomInvoiceModal;
    window.openManualOrderModal = openManualOrderModal;
    window.closeManualOrderModal = closeManualOrderModal;
    window.handleAdminLogin = handleAdminLogin;
    window.handleLogout = handleLogout;
    window.showSupportDialog = showSupportDialog;
    window.addAdminUser = addAdminUser;
    window.updateAdminUser = updateAdminUser;
    window.updateAdminUserDetails = updateAdminUserDetails;
    window.deleteAdminUser = deleteAdminUser;
    window.renderCredentialsUI = renderCredentialsUI;
    window.renderAdminOrders = renderAdminOrders;
    window.handleDeleteUserUI = handleDeleteUserUI;
    window.handleEditUserUI = handleEditUserUI;
    window.selectDevice = selectDevice;
    window.selectBrand = selectBrand;
    window.selectModel = selectModel;
    window.closePartDetails = closePartDetails;
    window.closeTermsModal = closeTermsModal;
    window.printOrderDetails = printOrderDetails;

    // ========================================================================
    // MODULE 15: EVENT LISTENERS & INITIALIZATION
    // Attach all event listeners and initialize the application
    // ========================================================================

    // Service selection event listeners
    document.querySelectorAll('.device-card').forEach(card => {
        card.addEventListener('click', () => selectDevice(card.dataset.device));
    });

    document.getElementById('backToDevice')?.addEventListener('click', () => {
        showStep(1);
        updateProgressSteps(1);
    });

    document.getElementById('backToBrand')?.addEventListener('click', () => {
        showStep(2);
        updateProgressSteps(2);
    });

    document.getElementById('backToModel')?.addEventListener('click', () => {
        showStep(3);
        updateProgressSteps(3);
    });

    // Cart & checkout events
    DOM.cartBtn?.addEventListener('click', () => showPage('cart'));
    DOM.checkoutBtn?.addEventListener('click', () => {
        if (Storage.cart.length > 0) {
            showPage('checkout');
        }
    });

    // Checkout form submission - Create order via API
    DOM.checkoutForm?.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateCheckoutForm()) {
            showToast('Please fix the errors above');
            return;
        }

        const btn = this.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.textContent = t('Processing...');
        btn.disabled = true;

        try {
            // Get form data
            const firstName = document.getElementById('checkoutFirstName').value.trim();
            const lastName = document.getElementById('checkoutLastName').value.trim();
            const customerName = firstName + ' ' + lastName;
            const customerEmail = document.getElementById('checkoutEmail').value.trim();
            const countryCode = document.getElementById('countryCode')?.value || '+420';
            const phoneOnly = document.getElementById('checkoutPhone').value.trim();
            const customerPhone = buildCustomerPhone(countryCode, phoneOnly);
            const customerAddress = document.getElementById('checkoutAddress')?.value.trim() || '';
            const customerCity = document.getElementById('checkoutCity')?.value.trim() || '';
            const customerZip = document.getElementById('checkoutZip')?.value.trim() || '';
            const serviceType = document.querySelector('input[name="serviceType"]:checked')?.value || 'delivery';
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'pay_on_delivery';
            const country = document.getElementById('checkoutCountry')?.value || 'Czech Republic';
            const notes = document.getElementById('checkoutNotes')?.value.trim() || '';
            
            // Calculate delivery fee based on service type
            let deliveryFee = 0;
            if (serviceType === 'pickup') {
                deliveryFee = getPickupFee();
            } else if (serviceType === 'zasilkovna') {
                deliveryFee = getPacketaFee();
            } else if (serviceType === 'ceska-posta') {
                deliveryFee = getCeskaPostaFee();
            } else if (serviceType === 'ppl') {
                deliveryFee = getPPLFee();
            } else if (serviceType === 'dpd') {
                deliveryFee = getDPDFee();
            } else if (serviceType === 'gls') {
                deliveryFee = getGLSFee();
            }

            let paymentFee = 0;
            if (paymentMethod === 'gopay') {
                paymentFee = getGopayFee();
            } else if (paymentMethod === 'bank_transfer') {
                paymentFee = getBankTransferFee();
            }
            
            const packetaPoint = serviceType === 'zasilkovna' ? packetaSelection : null;
            
            // Validate cart
            if (Storage.cart.length === 0) {
                throw new Error(t('Cart is empty'));
            }

            // Validate required fields before sending
            if (!customerName) throw new Error(t('Full Name is required'));
            if (!customerEmail) throw new Error(t('Email is required'));
            if (!phoneOnly) throw new Error(t('Phone is required'));
            if (serviceType === 'zasilkovna' && !packetaPoint) {
                throw new Error(t('Pickup point required'));
            }

            // Create order via API
            const orderData = {
                customerName,
                customerEmail,
                customerPhone,
                customerAddress,
                customerCity,
                customerZip,
                serviceType,
                paymentMethod,
                paymentFee,
                country,
                notes,
                deliveryFee,
                packetaPoint,
                cartItems: Storage.cart
            };

            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            };

            const response = await fetch(`${API_BASE_URL}/orders`, options);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Failed to create order');
            }

            const orderNum = result.order.orderNumber;
            const orderTotalValue = Number(result?.order?.total || 0);

            // Clear cart: both locally and via API if authenticated
            localStorage.removeItem('localCart');
            Storage.cart = [];
            
            // If authenticated, also clear cart on backend
            if (Storage.getToken()) {
                try {
                    await fetch(`${API_BASE_URL}/cart`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            ...getAuthHeader()
                        }
                    });
                } catch (err) {
                    // Log error quietly
                    console.error('Failed to clear backend cart:', err);
                }
            }
            
            if (DOM.cartCountEls?.length) {
                DOM.cartCountEls.forEach((countEl) => {
                    countEl.textContent = '0';
                    countEl.setAttribute('data-count', '0');
                });
            }

            // Show success modal instead of replacing form
            const existingModal = document.getElementById('orderSuccessModal');
            if (existingModal) existingModal.remove();
            
            const successModal = document.createElement('div');
            successModal.id = 'orderSuccessModal';
            successModal.className = 'order-success-modal';
            successModal.innerHTML = `
                <div class="order-success-overlay"></div>
                <div class="order-success-content">
                    <div class="order-success">
                        <div class="success-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <h2>${t('Thank You!')}</h2>
                        <p>${t('Your repair order has been placed successfully.')}</p>
                        <p>${t("We'll contact you shortly to confirm the details.")}</p>
                        <div class="order-number">${t('Order #')}${escapeHtml(orderNum)}</div>
                        ${paymentMethod === 'bank_transfer' ? `
                            <div class="order-success-bank-transfer" style="margin-top:14px;padding:12px;border:1px solid #d8ccff;border-radius:10px;background:#f8f5ff;text-align:left;">
                                <strong>Bank Transfer Message:</strong>
                                <div style="margin-top:6px;">Order Number (VS): <strong>${escapeHtml(orderNum)}</strong></div>
                                <div style="margin-top:4px;">Amount to pay: <strong>${escapeHtml(formatCurrency(orderTotalValue + BANK_TRANSFER_SPECIAL_EXTRA_CZK))}</strong> (${escapeHtml(formatCurrency(orderTotalValue))} + ${BANK_TRANSFER_SPECIAL_EXTRA_CZK} Kč)</div>
                                ${getBankTransferAccount() ? `<div style="margin-top:4px;">Account: <strong>${escapeHtml(getBankTransferAccount())}</strong></div>` : ''}
                                ${getBankTransferIban() ? `<div style="margin-top:4px;">IBAN: <strong>${escapeHtml(getBankTransferIban())}</strong></div>` : ''}
                            </div>
                        ` : ''}
                        <div style="display: flex; gap: 12px; margin-top: 20px; justify-content: center;">
                            <button class="btn btn-primary" data-success-action="home">${t('Back to Home')}</button>
                            <button class="btn btn-secondary" data-success-action="cart">${t('Continue Shopping')}</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(successModal);

            successModal.querySelectorAll('[data-success-action]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.getAttribute('data-success-action');
                    successModal.remove();
                    showPage(action === 'home' ? 'home' : 'cart');
                });
            });

            // Add some CSS for the modal
            const style = document.createElement('style');
            style.textContent = `
                #orderSuccessModal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .order-success-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                }
                .order-success-content {
                    position: relative;
                    z-index: 10000;
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    max-width: 500px;
                    text-align: center;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                }
                .success-icon {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 20px;
                    background: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .success-icon svg {
                    width: 40px;
                    height: 40px;
                    color: white;
                }
                .order-success-content h2 {
                    margin: 0 0 12px 0;
                    font-size: 24px;
                    color: #1f2937;
                }
                .order-success-content p {
                    color: #6b7280;
                    margin: 8px 0;
                }
                .order-number {
                    font-size: 18px;
                    font-weight: 600;
                    color: #3b82f6;
                    margin-top: 16px;
                }
            `;
            if (!document.head.querySelector('style[data-order-modal]')) {
                style.setAttribute('data-order-modal', 'true');
                document.head.appendChild(style);
            }

            // Clear saved form data after successful order
            Object.keys(checkoutFields).forEach(fieldId => {
                localStorage.removeItem(`checkout_${fieldId}`);
            });
            localStorage.removeItem('checkout_serviceType');
            localStorage.removeItem('checkout_countryCode');
            localStorage.removeItem('checkout_checkoutCountry');
            localStorage.removeItem('checkout_termsCheckbox');
            localStorage.removeItem('checkout_packeta_point');
            packetaSelection = null;
            
            // Reset button state
            btn.textContent = originalText;
            btn.disabled = false;

        } catch (error) {
            showToast('Failed to create order: ' + error.message);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });

    // Service type radio buttons
    document.getElementById('packetaPointDisplay')?.addEventListener('click', () => {
        openPacketaWidget();
    });

    document.getElementById('packetaPointDisplay')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPacketaWidget();
        }
    });

    let lastPacketaOpenAt = 0;
    const openPacketaFromSelection = () => {
        const now = Date.now();
        // Avoid double-opening when click + change fire back-to-back.
        if (now - lastPacketaOpenAt < 500) return;
        lastPacketaOpenAt = now;
        openPacketaWidget();
    };

    document.querySelectorAll('input[name="serviceType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const addressSection = document.getElementById('addressSection');
            const packetaSection = document.getElementById('packetaSection');
            const subtotal = Storage.cart.reduce((sum, item) => sum + item.price, 0);

            if (this.value === 'pickup') {
                addressSection.style.display = 'block';
                if (packetaSection) packetaSection.style.display = 'none';
            } else if (this.value === 'zasilkovna') {
                addressSection.style.display = 'none';
                if (packetaSection) packetaSection.style.display = 'block';
                openPacketaFromSelection();
            } else if (['ceska-posta', 'ppl', 'dpd', 'gls'].includes(this.value)) {
                addressSection.style.display = 'block';
                if (packetaSection) packetaSection.style.display = 'none';
            } else {
                addressSection.style.display = 'none';
                if (packetaSection) packetaSection.style.display = 'none';
            }
            updateCheckoutTotals(subtotal);
        });
    });

    document.querySelector('input[name="serviceType"][value="zasilkovna"]')?.addEventListener('click', () => {
        const addressSection = document.getElementById('addressSection');
        const packetaSection = document.getElementById('packetaSection');
        const subtotal = Storage.cart.reduce((sum, item) => sum + item.price, 0);
        if (addressSection) addressSection.style.display = 'none';
        if (packetaSection) packetaSection.style.display = 'block';
        updateCheckoutTotals(subtotal);
        openPacketaFromSelection();
    });

    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const gopaySection = document.getElementById('gopaySection');
            const bankTransferSection = document.getElementById('bankTransferSection');
            const subtotal = Storage.cart.reduce((sum, item) => sum + item.price, 0);

            if (this.value === 'gopay' && isGopayEnabled()) {
                if (gopaySection) gopaySection.style.display = 'block';
                if (bankTransferSection) bankTransferSection.style.display = 'none';
            } else if (this.value === 'bank_transfer' && isBankTransferEnabled()) {
                if (gopaySection) gopaySection.style.display = 'none';
                if (bankTransferSection) bankTransferSection.style.display = 'block';
            } else {
                if (gopaySection) gopaySection.style.display = 'none';
                if (bankTransferSection) bankTransferSection.style.display = 'none';
            }

            updateCheckoutTotals(subtotal);
        });
    });

    // Form persistence for checkout
    const checkoutFields = {
        'checkoutFirstName': 'firstNameError',
        'checkoutLastName': 'lastNameError',
        'checkoutEmail': 'emailError',
        'checkoutPhone': 'phoneError',
        'checkoutAddress': 'addressError',
        'checkoutCity': 'cityError',
        'checkoutZip': 'zipError',
        'checkoutCountry': 'countryError',
        'checkoutNotes': null
    };

    // Save form data to localStorage when user types
    Object.keys(checkoutFields).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Restore saved value on page load
            const saved = localStorage.getItem(`checkout_${fieldId}`);
            if (saved) field.value = saved;
            
            // Save value as user types
            field.addEventListener('input', () => {
                localStorage.setItem(`checkout_${fieldId}`, field.value);
            });
            
            // Also save service type
            field.addEventListener('change', () => {
                localStorage.setItem(`checkout_${fieldId}`, field.value);
            });
        }
    });
    
    // Handle country code dropdown
    const countryCodeSelect = document.getElementById('countryCode');
    if (countryCodeSelect) {
        // Restore saved country code
        const savedCountry = localStorage.getItem('checkout_countryCode');
        if (savedCountry) countryCodeSelect.value = savedCountry;
        
        // Save country code when changed
        countryCodeSelect.addEventListener('change', function() {
            localStorage.setItem('checkout_countryCode', this.value);
        });
    }

    // Handle country dropdown (new field)
    const countrySelect = document.getElementById('checkoutCountry');
    if (countrySelect) {
        // Restore saved country
        const savedCountry = localStorage.getItem('checkout_checkoutCountry');
        if (savedCountry) countrySelect.value = savedCountry;
        
        // Save country when changed
        countrySelect.addEventListener('change', function() {
            localStorage.setItem('checkout_checkoutCountry', this.value);
        });
    }
    
    // Restore service type radio button
    const savedServiceType = localStorage.getItem('checkout_serviceType');
    if (savedServiceType) {
        const radio = document.querySelector(`input[name="serviceType"][value="${savedServiceType}"]`);
        if (radio) {
            radio.checked = true;
            // Trigger change event to update UI
            radio.dispatchEvent(new Event('change'));
        }
    }
    
    // Save service type when changed
    document.querySelectorAll('input[name="serviceType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            localStorage.setItem('checkout_serviceType', this.value);
        });
    });

    // Handle terms and conditions checkbox persistence
    const termsCheckbox = document.getElementById('termsCheckbox');
    if (termsCheckbox) {
        // Restore saved terms acceptance
        const savedTerms = localStorage.getItem('checkout_termsCheckbox') === 'true';
        if (savedTerms) termsCheckbox.checked = true;
        
        // Save when changed
        termsCheckbox.addEventListener('change', function() {
            localStorage.setItem('checkout_termsCheckbox', this.checked);
            if (this.checked) {
                clearFieldError('termsCheckbox', 'termsError');
            }
        });
    }

    // Real-time checkout form validation
    const checkoutValidationFields = {
        'checkoutFirstName': 'firstNameError',
        'checkoutLastName': 'lastNameError',
        'checkoutEmail': 'emailError',
        'checkoutPhone': 'phoneError',
        'checkoutAddress': 'addressError',
        'checkoutCity': 'cityError',
        'checkoutZip': 'zipError',
        'checkoutCountry': 'countryError'
    };

    Object.keys(checkoutValidationFields).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                if (this.value.trim()) {
                    validateCheckoutForm();
                }
            });

            field.addEventListener('input', function() {
                if (this.classList.contains('error')) {
                    clearFieldError(fieldId, checkoutValidationFields[fieldId]);
                }
            });
        }
    });

    // Navigation
    DOM.navPageLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showPage(this.dataset.page);
        });
    });

    DOM.trackForm?.addEventListener('submit', handleTrackFormSubmit);

    // Terms link
    document.getElementById('termsLink')?.addEventListener('click', (event) => {
        event.preventDefault();
        openTermsModal();
    });

    // Email modal close handlers
    const emailModal = document.getElementById('emailModal');
    const emailOverlay = emailModal?.querySelector('.email-modal-overlay');
    const emailClose = emailModal?.querySelector('.email-modal-close');
    const emailCancel = emailModal?.querySelector('.email-modal-actions .btn.btn-secondary');
    emailOverlay?.addEventListener('click', closeEmailModal);
    emailClose?.addEventListener('click', closeEmailModal);
    emailCancel?.addEventListener('click', closeEmailModal);

    // Contact modal close handlers
    const contactModal = document.getElementById('contactModal');
    const contactOverlay = contactModal?.querySelector('.email-modal-overlay');
    const contactClose = contactModal?.querySelector('.email-modal-close');
    contactOverlay?.addEventListener('click', closeContactModal);
    contactClose?.addEventListener('click', closeContactModal);

    // Terms modal close handlers
    const termsModal = document.getElementById('termsModal');
    const termsOverlay = termsModal?.querySelector('.email-modal-overlay');
    const termsClose = termsModal?.querySelector('.email-modal-close');
    termsOverlay?.addEventListener('click', closeTermsModal);
    termsClose?.addEventListener('click', closeTermsModal);

    // Order details modal close handlers
    const orderModal = document.getElementById('orderDetailsModal');
    const orderOverlay = orderModal?.querySelector('.order-details-overlay');
    const orderClose = orderModal?.querySelector('.order-details-close');
    orderOverlay?.addEventListener('click', closeOrderDetails);
    orderClose?.addEventListener('click', closeOrderDetails);

    function closeMobileMenu() {
        if (!DOM.mobileMenuBtn || !DOM.navLinks) return;
        DOM.mobileMenuBtn.classList.remove('active');
        DOM.navLinks.classList.remove('active');
        DOM.mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }

    // Mobile menu toggle
    DOM.mobileMenuBtn?.addEventListener('click', function() {
        this.classList.toggle('active');
        DOM.navLinks.classList.toggle('active');
        const expanded = this.classList.contains('active');
        this.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    });

    // Auto-close mobile nav after selecting a destination link.
    DOM.navLinks?.querySelectorAll('a[data-page]').forEach((link) => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    document.getElementById('logoutBtnMobile')?.addEventListener('click', handleLogout);

    // Part details modal close handlers
    const partModal = document.getElementById('partDetailsModal');
    const partOverlay = partModal?.querySelector('.part-details-overlay');
    const partClose = partModal?.querySelector('.part-details-close');
    partOverlay?.addEventListener('click', closePartDetails);
    partClose?.addEventListener('click', closePartDetails);

    // Other item details modal close handlers
    const otherModal = document.getElementById('otherDetailsModal');
    const otherOverlay = otherModal?.querySelector('.part-details-overlay');
    const otherClose = document.getElementById('otherDetailsClose');
    otherOverlay?.addEventListener('click', closeOtherDetails);
    otherClose?.addEventListener('click', closeOtherDetails);
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closePartDetails();
            closeOtherDetails();
            closeUsedDetails();
            closeTermsModal();
            closeContactModal();
            closeNewsDetailsModal();
        }
    });

    // Admin panel
    DOM.loginForm?.addEventListener('submit', handleAdminLogin);
    DOM.logoutBtn?.addEventListener('click', handleLogout);

    let adminBindingsInitialized = false;
    function initAdminBindings() {
        if (adminBindingsInitialized) return;
        adminBindingsInitialized = true;

        DOM.statusFilter?.addEventListener('change', renderAdminOrders);
        DOM.orderTypeFilter?.addEventListener('change', renderAdminOrders);

        document.addEventListener('click', (event) => {
            const actionBtn = event.target.closest('[data-order-action]');
            if (!actionBtn) return;

            const action = actionBtn.dataset.orderAction;
            const orderId = actionBtn.dataset.orderId;

            if (action === 'edit-status') {
                editOrderStatus(orderId);
                return;
            }
            if (action === 'details') {
                if (typeof window.showOrderDetails === 'function') {
                    window.showOrderDetails(orderId);
                }
                return;
            }
            if (action === 'email') {
                const email = actionBtn.dataset.orderEmail || '';
                const name = actionBtn.dataset.orderName || '';
                emailCustomer(orderId, email, name);
                return;
            }
            if (action === 'invoice') {
                printInvoiceForOrder(orderId);
                return;
            }
            if (action === 'delete') {
                deleteOrder(orderId);
            }
        });

        // Admin Main Tabs (Repairs vs Custom PC)
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            const currentUser = Storage.getUser();

            if (!canAccessAdminTab(tabName, currentUser)) {
                showToast(t('Permission denied'));
                return;
            }
            
            // Update active button
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-content`).classList.add('active');
            
            // Render appropriate content
            if (tabName === 'repairs') {
                // Reset device filter to 'all' when switching tabs
                document.querySelectorAll('.device-tab-btn').forEach(d => d.classList.remove('active'));
                document.querySelector('[data-device="all"]')?.classList.add('active');
            }
            if (tabName === 'catalog') {
                renderCatalogEditor();
            }
            if (tabName === 'credentials') {
                const credentialsContent = document.getElementById('credentialsContent');
                const toggleCredentialsBtn = document.getElementById('toggleCredentials');
                if (credentialsContent) credentialsContent.style.display = 'flex';
                if (toggleCredentialsBtn) toggleCredentialsBtn.textContent = t('Hide');
                renderCredentialsUI();
            }
            if (tabName === 'chats') {
                ensureAdminChatInboxInitialized();
                loadAdminChatSessions();
                loadAdminChatAiConfig();
            }
            renderAdminOrders();
            });
        });

        // Device Type Tabs for Repairs
        document.querySelectorAll('.device-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
            const device = this.dataset.device;
            
            // Update active button
            document.querySelectorAll('.device-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Store current device filter and re-render
            window.currentDeviceFilter = device;
            renderAdminOrders();
            });
        });

        document.querySelectorAll('.custompc-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
            const buildType = this.dataset.build || 'all';
            document.querySelectorAll('.custompc-tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.currentCustomPcFilter = buildType;
            renderAdminOrders();
            });
        });

    document.getElementById('catalogAddBrand')?.addEventListener('click', () => {
        ensureCatalogState();
        const device = catalogDraft.services[catalogUiState.deviceKey];
        if (!device) return;
        const name = prompt('Brand name?');
        if (!name) return;
        const id = slugify(name) || `brand-${Date.now()}`;
        device.brands = device.brands || [];
        device.brands.push({ id, name, active: true });
        if (!device.models) device.models = {};
        device.models[id] = [];
        catalogUiState.brandId = id;
        renderCatalogRepairs();
    });

    document.getElementById('catalogAddRepair')?.addEventListener('click', () => {
        ensureCatalogState();
        const device = catalogDraft.services[catalogUiState.deviceKey];
        if (!device) return;
        const name = prompt('Repair name?');
        if (!name) return;
        const id = slugify(name) || `repair-${Date.now()}`;
        device.repairs = device.repairs || [];
        device.repairs.push({ id, name, desc: '', price: 0, icon: 'other', active: true });
        renderCatalogRepairs();
    });

    document.getElementById('catalogAddModel')?.addEventListener('click', () => {
        ensureCatalogState();
        const device = catalogDraft.services[catalogUiState.deviceKey];
        if (!device) return;
        const name = prompt('Model name?');
        if (!name) return;
        if (!device.models) device.models = {};
        const list = device.models[catalogUiState.brandId] || [];
        list.push({ name, active: true });
        device.models[catalogUiState.brandId] = list;
        renderCatalogRepairs();
    });

    document.getElementById('catalogAddBuildItem')?.addEventListener('click', () => {
        ensureCatalogState();
        const category = catalogUiState.buildCategory;
        if (!category) return;
        const name = prompt('Part name?');
        if (!name) return;
        const id = slugify(name) || `${category}-${Date.now()}`;
        const list = catalogDraft.customBuilds[category] || [];
        list.push({ id, name, price: 0, images: [], active: true });
        catalogDraft.customBuilds[category] = list;
        renderCatalogBuilds();
    });

    document.getElementById('catalogAddPrinter')?.addEventListener('click', () => {
        ensureCatalogState();
        const name = prompt('Printer name?');
        if (!name) return;
        const id = slugify(name) || `printer-${Date.now()}`;
        catalogDraft.printing.printers = catalogDraft.printing.printers || [];
        catalogDraft.printing.printers.push({ id, name, desc: '', image: '', active: true });
        renderCatalogPrinting();
    });

    document.getElementById('catalogAddFilament')?.addEventListener('click', () => {
        ensureCatalogState();
        const name = prompt('Filament name?');
        if (!name) return;
        const id = slugify(name) || `filament-${Date.now()}`;
        catalogDraft.printing.filaments = catalogDraft.printing.filaments || [];
        catalogDraft.printing.filaments.push({ id, name, active: true });
        renderCatalogPrinting();
    });

    document.getElementById('catalogAddColor')?.addEventListener('click', () => {
        ensureCatalogState();
        const name = prompt('Color name?');
        if (!name) return;
        const hex = prompt('Hex color? (e.g. #ff0000)', '#94a3b8') || '#94a3b8';
        const id = slugify(name) || `color-${Date.now()}`;
        catalogDraft.printing.colors = catalogDraft.printing.colors || [];
        catalogDraft.printing.colors.push({ id, name, hex, active: true });
        renderCatalogPrinting();
    });

    document.getElementById('catalogAddOtherItem')?.addEventListener('click', () => {
        ensureCatalogState();
        const name = prompt('Item name?');
        if (!name) return;
        const id = slugify(name) || `other-${Date.now()}`;
        catalogDraft.printing.otherItems = catalogDraft.printing.otherItems || [];
        catalogDraft.printing.otherItems.push({ id, name, desc: '', price: 0, image: '', details: '', specs: [], active: true });
        renderCatalogOtherItems();
    });

    document.getElementById('catalogAddUsedShopItem')?.addEventListener('click', () => {
        ensureCatalogState();
        const name = prompt('Used device name?');
        if (!name) return;
        const id = slugify(name) || `used-${Date.now()}`;
        catalogDraft.printing.usedShopItems = catalogDraft.printing.usedShopItems || [];
        catalogDraft.printing.usedShopItems.push({
            id,
            name,
            brand: '',
            model: '',
            shortDesc: '',
            details: '',
            price: 0,
            image: '',
            images: [],
            specs: [],
            active: true
        });
        renderCatalogUsedShop();
    });

    document.getElementById('catalogAddNewsItem')?.addEventListener('click', () => {
        ensureCatalogState();
        const title = prompt('News title?');
        if (!title) return;
        catalogDraft.news = normalizeNewsItems(catalogDraft.news);
        catalogDraft.news.unshift({
            id: slugify(title) || `news-${Date.now()}`,
            title: String(title || '').trim(),
            image: '',
            summary: '<p>Short summary...</p>',
            content: '<p>Full details...</p>',
            active: true,
            publishedAt: new Date().toISOString(),
            sortOrder: 0
        });
        catalogDraft.news.forEach((item, index) => {
            item.sortOrder = index;
        });
        renderCatalogNews();
    });

    document.getElementById('catalogLoadBtn')?.addEventListener('click', () => {
        catalogDraft = cloneCatalog();
        renderCatalogEditor();
        showToast('Catalog loaded into editor');
    });

    const saveCatalogHandler = async () => {
        const advancedPanel = document.getElementById('catalog-advanced');
        const servicesInput = document.getElementById('catalogServicesInput');
        const buildsInput = document.getElementById('catalogBuildsInput');
        const printingInput = document.getElementById('catalogPrintingInput');
        const checkoutInput = document.getElementById('catalogCheckoutInput');
        const newsInput = document.getElementById('catalogNewsInput');

        try {
            let catalog = null;
            if (advancedPanel && advancedPanel.classList.contains('active')) {
                if (!servicesInput || !buildsInput || !printingInput || !checkoutInput || !newsInput) return;
                catalog = {
                    services: JSON.parse(servicesInput.value || '{}'),
                    customBuilds: JSON.parse(buildsInput.value || '{}'),
                    printing: JSON.parse(printingInput.value || '{}'),
                    checkout: JSON.parse(checkoutInput.value || '{}'),
                    announcement: catalogDraft?.announcement || { active: false, text: '' },
                    newsSortMode: String(catalogDraft?.newsSortMode || newsSortMode || 'manual').toLowerCase() === 'newest' ? 'newest' : 'manual',
                    news: JSON.parse(newsInput.value || '[]')
                };
            } else {
                ensureCatalogState();
                catalog = {
                    services: catalogDraft.services,
                    customBuilds: catalogDraft.customBuilds,
                    printing: catalogDraft.printing,
                    checkout: catalogDraft.checkout || { ...defaultCheckoutOptions },
                    announcement: catalogDraft.announcement || { active: false, text: '' },
                    newsSortMode: String(catalogDraft.newsSortMode || newsSortMode || 'manual').toLowerCase() === 'newest' ? 'newest' : 'manual',
                    news: normalizeNewsItems(catalogDraft.news)
                };
            }

            await apiCall('PUT', '/catalog', { catalog });
            applyCatalog(catalog);
            catalogDraft = cloneCatalog();
            renderCatalogEditor();

            if (document.getElementById('printing')?.classList.contains('active')) {
                renderPrintingPage();
            }
            if (document.getElementById('services')?.classList.contains('active')) {
                resetServiceSelection();
            }
            if (document.getElementById('custompc')?.classList.contains('active')) {
                renderCustomPCPage();
            }
            if (document.getElementById('used-shop')?.classList.contains('active')) {
                renderUsedShopPage();
            }
            showToast('Catalog saved');
        } catch (error) {
            console.error('Catalog save error:', error);
            showToast('Invalid data or failed to save catalog');
        }
    };

        document.getElementById('catalogSaveBtn')?.addEventListener('click', saveCatalogHandler);
        document.getElementById('catalogSaveBtnTop')?.addEventListener('click', saveCatalogHandler);

        const catalogUploadInput = document.getElementById('catalogUploadInput');
        const catalogUploadResult = document.getElementById('catalogUploadResult');
        if (catalogUploadInput) {
            catalogUploadInput.addEventListener('change', async () => {
            const file = catalogUploadInput.files && catalogUploadInput.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);
            if (catalogUploadResult) catalogUploadResult.textContent = t('Uploading...');

            try {
                const response = await fetch(`${API_BASE_URL}/uploads`, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeader()
                    },
                    body: formData
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Upload failed');
                }
                if (catalogUploadResult) {
                    catalogUploadResult.textContent = result.url;
                }
                showToast('Image uploaded');
            } catch (err) {
                console.error('Upload error:', err);
                if (catalogUploadResult) catalogUploadResult.textContent = t('Upload failed');
                showToast('Upload failed');
            } finally {
                catalogUploadInput.value = '';
            }
            });
        }

        DOM.clearOrdersBtn?.addEventListener('click', async function() {
            if (confirm(t('Are you sure you want to clear ALL orders? This action cannot be undone.'))) {
            try {
                // Get all orders first
                const result = await apiCall('GET', '/orders');
                const orders = result.orders || [];
                
                // Delete each order
                for (const order of orders) {
                    try {
                        await apiCall('DELETE', `/orders/${order.id}`);
                    } catch (err) {
                        console.error(`Failed to delete order ${order.id}:`, err);
                    }
                }
                
                // Clear local storage
                Storage.orders = [];
                await Storage.saveOrders();
                await renderAdminOrders();
                showToast('All orders have been cleared');
            } catch (error) {
                showToast('Failed to clear orders: ' + error.message);
            }
            }
        });

        document.getElementById('createManualOrderBtn')?.addEventListener('click', () => {
            openManualOrderModal();
        });

        document.getElementById('createCustomInvoiceBtn')?.addEventListener('click', () => {
            openCustomInvoiceModal();
        });

        // Social links save
        document.getElementById('saveSocialLinksBtn')?.addEventListener('click', async () => {
            const insta = String(document.getElementById('adminInstagramUrl')?.value || '').trim();
            const fb = String(document.getElementById('adminFacebookUrl')?.value || '').trim();
            const msgEl = document.getElementById('socialLinksSaveMsg');
            try {
                const socialLinks = { instagram: insta, facebook: fb };
                const currentCatalog = cloneCatalog();
                currentCatalog.socialLinks = socialLinks;
                await apiCall('PUT', '/catalog', { catalog: currentCatalog });
                if (catalogState) catalogState.socialLinks = socialLinks;
                applySocialLinks(socialLinks);
                if (msgEl) { msgEl.textContent = 'Uloženo ✓'; setTimeout(() => { msgEl.textContent = ''; }, 3000); }
            } catch (err) {
                if (msgEl) { msgEl.style.color = '#ef4444'; msgEl.textContent = 'Chyba při ukládání'; setTimeout(() => { msgEl.textContent = ''; msgEl.style.color = '#22c55e'; }, 4000); }
            }
        });

        // Credentials management
        const toggleCredentialsBtn = document.getElementById('toggleCredentials');
        const credentialsContent = document.getElementById('credentialsContent');

        if (toggleCredentialsBtn && credentialsContent) {
            toggleCredentialsBtn.addEventListener('click', function() {
            const isHidden = credentialsContent.style.display === 'none';
            credentialsContent.style.display = isHidden ? 'flex' : 'none';
            toggleCredentialsBtn.textContent = isHidden ? t('Hide') : t('Show');
            if (isHidden) {
                renderCredentialsUI();
            }
            });
        }

        // Add user form
        document.getElementById('addUserForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('newUsername').value.trim();
        const email = document.getElementById('newEmail')?.value.trim();
        const password = document.getElementById('newPassword').value;
        const role = document.getElementById('newRole')?.value || 'manager';
        const permissions = getPermissionSelection('new');

        if (!username && !email) {
            showCredentialsMessage('addUserMessage', 'Enter a username or email', false);
            return;
        }

        const result = await addAdminUser(username, password, email, role, permissions);
        showCredentialsMessage('addUserMessage', result.message, result.success);

        if (result.success) {
            this.reset();
            renderCredentialsUI();
        }
        });

        // Edit user form
        document.getElementById('editUserForm')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const userId = document.getElementById('editUserId')?.value;
        const username = document.getElementById('editUsername')?.value.trim();
        const email = document.getElementById('editEmail')?.value.trim();
        const password = document.getElementById('editPassword')?.value;
        const role = document.getElementById('editRole')?.value;
        const permissions = getPermissionSelection('edit');

        if (!userId) {
            showCredentialsMessage('editUserMessage', 'Select a user to edit', false);
            return;
        }

        if (!username) {
            showCredentialsMessage('editUserMessage', 'Username is required', false);
            return;
        }

        const payload = { username, email, role, permissions };
        if (password) payload.password = password;

        const result = await updateAdminUserDetails(userId, payload);
        showCredentialsMessage('editUserMessage', result.message, result.success);

        if (result.success) {
            document.getElementById('editPassword').value = '';
            renderCredentialsUI();
        }
        });

        // Reset credentials button
        document.getElementById('resetCredentialsBtn')?.addEventListener('click', function() {
            if (confirm(t('This will reset your admin credentials. Are you sure?'))) {
                showCredentialsMessage('resetMessage', 'Note: This feature requires server configuration. Contact an administrator.', false);
            }
        });
    }

    // Email form submission
    document.getElementById('emailForm')?.addEventListener('submit', handleEmailFormSubmit);

    // Close email modal when clicking overlay
    document.querySelector('.email-modal-overlay')?.addEventListener('click', closeEmailModal);

    // Show/hide password toggles (eye buttons)
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = targetId ? document.getElementById(targetId) : null;
            if (!input) return;
            const nextType = input.type === 'password' ? 'text' : 'password';
            input.type = nextType;
            btn.setAttribute('aria-label', t(nextType === 'text' ? 'Hide password' : 'Show password'));
        });
    });

    // Auth page tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.auth;
            document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.auth-panel').forEach(panel => panel.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(target === 'login' ? 'authLoginPanel' : 'authRegisterPanel')?.classList.add('active');
        });
    });

    // Auth handlers
    document.getElementById('authLoginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authLoginUsername')?.value.trim();
        const password = document.getElementById('authLoginPassword')?.value || '';
        const message = document.getElementById('authLoginMessage');
        const progress = createLoginProgressController();
        if (message) message.textContent = '';

        try {
            progress.show('Signing you in', 'Step 1/3: Verifying credentials...');
            progress.update(1, 'Step 1/3: Verifying credentials...');
            const result = await apiCall('POST', '/auth/login', { username, password });
            progress.update(2, 'Step 2/3: Loading account permissions...');
            Storage.setToken(result.token);
            Storage.setUser(result.user);
            Storage.setAdminLoggedIn(canAccessAdmin(result.user));
            updateAuthUI();
            progress.update(3, 'Step 3/3: Preparing your page...');
            showToast('Login successful');
            progress.complete('Login successful. Redirecting...');
            await new Promise(resolve => setTimeout(resolve, 260));
            showPage(canAccessAdmin(result.user) ? 'admin' : 'home');
        } catch (error) {
            if (message) message.textContent = t(error.message || 'Login failed');
            progress.error(t(error.message || 'Login failed'));
            await new Promise(resolve => setTimeout(resolve, 480));
        } finally {
            progress.hide();
        }
    });

    document.getElementById('authForgotLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        setupResetPanels('', '');
        showPage('reset-password');
        window.location.hash = '#reset-password';
    });

    document.getElementById('resetBackToLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('auth');
        window.location.hash = '#auth';
    });

    document.getElementById('resetRequestForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('resetEmail')?.value.trim();
        const message = document.getElementById('resetRequestMessage');
        if (message) message.textContent = '';

        try {
            await apiCall('POST', '/auth/forgot-password', { email });
            if (message) message.textContent = t('Reset link sent');
        } catch (error) {
            if (message) message.textContent = t(error.message || 'Failed to send reset link');
        }
    });

    document.getElementById('resetConfirmForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = document.getElementById('resetToken')?.value.trim();
        const email = document.getElementById('resetConfirmEmail')?.value.trim();
        const password = document.getElementById('resetNewPassword')?.value || '';
        const confirm = document.getElementById('resetConfirmPassword')?.value || '';
        const message = document.getElementById('resetConfirmMessage');
        if (message) message.textContent = '';

        if (password !== confirm) {
            if (message) message.textContent = t('Passwords do not match');
            return;
        }

        try {
            await apiCall('POST', '/auth/reset-password', { email, token, password });
            if (message) message.textContent = t('Password updated');
            showToast(t('Password updated'));
            showPage('auth');
            window.location.hash = '#auth';
        } catch (error) {
            if (message) message.textContent = t(error.message || 'Failed to reset password');
        }
    });

    document.getElementById('authRegisterForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('authRegisterUsername')?.value.trim();
        const email = document.getElementById('authRegisterEmail')?.value.trim();
        const password = document.getElementById('authRegisterPassword')?.value || '';
        const confirm = document.getElementById('authRegisterConfirm')?.value || '';
        const message = document.getElementById('authRegisterMessage');
        if (message) message.textContent = '';

        if (password !== confirm) {
            if (message) message.textContent = t('Passwords do not match');
            return;
        }

        try {
            const result = await apiCall('POST', '/auth/register', { username, email, password });
            Storage.setToken(result.token);
            Storage.setUser(result.user);
            Storage.setAdminLoggedIn(canAccessAdmin(result.user));
            updateAuthUI();
            showToast('Account created');
            showPage('home');
        } catch (error) {
            if (message) message.textContent = t(error.message || 'Registration failed');
        }
    });

    const startGoogleAuth = () => {
        window.location.href = `${API_BASE_URL}/auth/google`;
    };
    document.getElementById('authGoogleBtn')?.addEventListener('click', startGoogleAuth);
    document.getElementById('authGoogleBtnRegister')?.addEventListener('click', startGoogleAuth);

    function toggleLanguage() {
        i18nState.lang = i18nState.lang === 'cs' ? 'en' : 'cs';
        localStorage.setItem('lang', i18nState.lang);
        applyTranslations();
    }

    DOM.langToggle?.addEventListener('click', toggleLanguage);

    document.getElementById('langToggleMobile')?.addEventListener('click', toggleLanguage);

    DOM.cookieAcceptBtn?.addEventListener('click', () => {
        saveCookieConsent('accepted');
    });

    DOM.cookieDeclineBtn?.addEventListener('click', () => {
        saveCookieConsent('declined');
    });

    // Floating support chat + admin chat inbox
    const supportChatState = {
        sessionId: localStorage.getItem('supportChatSessionId') || '',
        lastSeenAdminMessageId: Number(localStorage.getItem('supportChatLastSeenAdminMessageId') || 0),
        profile: {
            name: localStorage.getItem('supportChatName') || Storage.getUser()?.username || '',
            email: localStorage.getItem('supportChatEmail') || Storage.getUser()?.email || '',
            helpTopic: localStorage.getItem('supportChatHelpTopic') || ''
        },
        onboardingStage: 'name',
        isClosed: false,
        sessionMeta: null,
        pollId: null,
        typingStopTimer: null,
        typingActive: false,
        submitInFlight: false,
        serverUnreadCount: 0
    };

    const adminChatState = {
        sessions: [],
        adminUsers: [],
        activeSessionId: null,
        pollId: null,
        typingStopTimer: null,
        typingActive: false,
        statusFilter: 'all',
        adminFilter: 'all',
        loadErrorVisible: false,
        aiConfigLoaded: false,
        aiConfigLoading: false,
        aiConfigSaving: false
    };

    const supportRatingState = {
        selected: 0,
        sessionId: '',
        adminName: ''
    };

    function supportRatingKey(sessionId, adminName) {
        return `supportChatRating:${sessionId}:${String(adminName || '').toLowerCase()}`;
    }

    function markSupportRatingHandled(sessionId, adminName, value) {
        if (!sessionId || !adminName) return;
        localStorage.setItem(supportRatingKey(sessionId, adminName), value);
    }

    function supportRatingAlreadyHandled(sessionId, adminName) {
        if (!sessionId || !adminName) return false;
        return Boolean(localStorage.getItem(supportRatingKey(sessionId, adminName)));
    }

    function renderSupportRatingStars() {
        const starsWrap = document.getElementById('supportRatingStars');
        if (!starsWrap) return;
        starsWrap.querySelectorAll('.support-rating-star').forEach((btn) => {
            const val = Number(btn.getAttribute('data-rating') || 0);
            btn.classList.toggle('active', val > 0 && val <= supportRatingState.selected);
        });
    }

    function closeSupportRatingModal() {
        const modal = document.getElementById('supportRatingModal');
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        supportRatingState.selected = 0;
        renderSupportRatingStars();
    }

    async function submitSupportRating() {
        const selected = Number(supportRatingState.selected || 0);
        if (!selected || !supportRatingState.sessionId || !supportRatingState.adminName) {
            showToast('Vyberte prosím hodnocení 1-5 hvězd.');
            return;
        }

        try {
            await apiCall('POST', `/chat/messages/${supportRatingState.sessionId}`, {
                message: `Hodnocení admina ${supportRatingState.adminName}: ${selected}/5`,
                senderName: supportChatState.profile.name || Storage.getUser()?.username || 'Visitor'
            });
            markSupportRatingHandled(supportRatingState.sessionId, supportRatingState.adminName, `rated:${selected}`);
            closeSupportRatingModal();
            clearSupportChatLocalSession();
            const body = document.getElementById('supportChatBody');
            const input = document.getElementById('supportChatInput');
            const form = document.getElementById('supportChatForm');
            const panel = document.getElementById('supportChatPanel');
            const root = document.getElementById('supportChat');
            const toggleBtn = document.getElementById('supportChatToggle');
            if (body) body.innerHTML = '';
            if (input) {
                input.value = '';
                input.disabled = false;
                input.placeholder = 'Napis zpravu...';
            }
            const sendBtn = form?.querySelector('button[type="submit"]') || form?.querySelector('button');
            if (sendBtn) sendBtn.disabled = false;
            if (supportChatState.pollId) {
                clearInterval(supportChatState.pollId);
                supportChatState.pollId = null;
            }
            root?.classList.remove('open');
            if (panel) {
                panel.inert = true;
                panel.setAttribute('aria-hidden', 'true');
            }
            toggleBtn?.setAttribute('aria-expanded', 'false');
            showToast('Děkujeme za hodnocení.');
        } catch (err) {
            console.error('Submit support rating failed:', err);
            showToast('Nepodařilo se odeslat hodnocení.');
        }
    }

    function openSupportRatingModal(adminName, sessionId) {
        if (!adminName || !sessionId) return;
        if (supportRatingAlreadyHandled(sessionId, adminName)) return;

        const modal = document.getElementById('supportRatingModal');
        const adminNameEl = document.getElementById('supportRatingAdminName');
        if (!modal || !adminNameEl) return;

        supportRatingState.sessionId = sessionId;
        supportRatingState.adminName = adminName;
        supportRatingState.selected = 0;
        adminNameEl.textContent = adminName;
        renderSupportRatingStars();
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
    }

    function initSupportRatingUi() {
        const modal = document.getElementById('supportRatingModal');
        const backdrop = document.getElementById('supportRatingBackdrop');
        const skipBtn = document.getElementById('supportRatingSkip');
        const submitBtn = document.getElementById('supportRatingSubmit');
        const starsWrap = document.getElementById('supportRatingStars');

        if (!modal || modal.dataset.bound === '1') return;

        starsWrap?.addEventListener('click', (event) => {
            const star = event.target.closest('.support-rating-star');
            if (!star) return;
            supportRatingState.selected = Number(star.getAttribute('data-rating') || 0);
            renderSupportRatingStars();
        });

        backdrop?.addEventListener('click', () => {
            if (supportRatingState.sessionId && supportRatingState.adminName) {
                markSupportRatingHandled(supportRatingState.sessionId, supportRatingState.adminName, 'skipped');
            }
            closeSupportRatingModal();
        });

        skipBtn?.addEventListener('click', () => {
            if (supportRatingState.sessionId && supportRatingState.adminName) {
                markSupportRatingHandled(supportRatingState.sessionId, supportRatingState.adminName, 'skipped');
            }
            closeSupportRatingModal();
        });

        submitBtn?.addEventListener('click', submitSupportRating);

        modal.dataset.bound = '1';
    }

    function formatChatTime(value) {
        try {
            return new Date(value).toLocaleString('cs-CZ', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
        } catch {
            return '';
        }
    }

    function saveSupportChatProfile() {
        localStorage.setItem('supportChatName', supportChatState.profile.name || '');
        localStorage.setItem('supportChatEmail', supportChatState.profile.email || '');
        localStorage.setItem('supportChatHelpTopic', supportChatState.profile.helpTopic || '');
    }

    function renderSupportChatUnreadBadge(count) {
        const badge = document.getElementById('supportChatUnreadBadge');
        if (!badge) return;

        const safeCount = Math.max(0, Number(count || 0));
        if (safeCount <= 0) {
            badge.style.display = 'none';
            badge.textContent = '0';
            return;
        }

        badge.style.display = 'inline-flex';
        badge.textContent = safeCount > 99 ? '99+' : String(safeCount);
    }

    function updateSupportChatUnread(messages = [], isOpen = false, serverUnreadCount = null) {
        if (!Array.isArray(messages)) {
            renderSupportChatUnreadBadge(0);
            return;
        }

        const adminMessages = messages.filter((msg) => {
            const text = String(msg?.message || '');
            if (/^__RATE_ADMIN__:/.test(text)) return false;
            return String(msg?.sender_type || '') === 'admin';
        });

        const latestAdminId = adminMessages.reduce((maxId, msg) => Math.max(maxId, Number(msg?.id || 0)), 0);

        if (isOpen) {
            if (latestAdminId > supportChatState.lastSeenAdminMessageId) {
                supportChatState.lastSeenAdminMessageId = latestAdminId;
                localStorage.setItem('supportChatLastSeenAdminMessageId', String(latestAdminId));
            }
            renderSupportChatUnreadBadge(0);
            return;
        }

        if (Number.isFinite(Number(serverUnreadCount))) {
            renderSupportChatUnreadBadge(Number(serverUnreadCount));
            return;
        }

        const unreadCount = adminMessages.filter((msg) => Number(msg?.id || 0) > supportChatState.lastSeenAdminMessageId).length;
        renderSupportChatUnreadBadge(unreadCount);
    }

    async function sendSupportTypingStatus(isTyping) {
        if (!supportChatState.sessionId) return;
        try {
            await apiCall('POST', `/chat/typing/${supportChatState.sessionId}`, {
                isTyping,
                name: supportChatState.profile.name || Storage.getUser()?.username || 'Visitor'
            });
            supportChatState.typingActive = Boolean(isTyping);
        } catch {
            // ignore transient typing status failures
        }
    }

    function getHelpTopicLabel(value) {
        const map = {
            'repair-service': 'Oprava zařízení',
            'order-status': 'Stav objednávky',
            'pricing': 'Ceny a nabídka',
            'custom-build': 'Vlastní sestava / server',
            '3d-printing': '3D tisk',
            'other': 'Jiné'
        };
        return map[value] || value || '';
    }

    function parseHelpTopicValue(rawValue) {
        const value = String(rawValue || '').trim().toLowerCase();
        const normalized = value
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9-]/g, '');
        if (!value) return '';
        if (['repair-service', 'oprava', 'oprava-zarizeni', 'servis', 'service', 'repair'].includes(normalized)) return 'repair-service';
        if (['order-status', 'stav', 'stav-objednavky', 'objednavka', 'order'].includes(normalized)) return 'order-status';
        if (['pricing', 'cena', 'ceny', 'price', 'nabidka'].includes(normalized)) return 'pricing';
        if (['custom-build', 'sestava', 'server', 'build'].includes(normalized)) return 'custom-build';
        if (['3d-printing', '3d', 'tisk', '3d-tisk', 'printing'].includes(normalized)) return '3d-printing';
        if (['other', 'jine', 'jine-pomoc'].includes(normalized)) return 'other';
        return '';
    }

    function hasSupportChatProfile() {
        return Boolean(
            String(supportChatState.profile.name || '').trim() &&
            String(supportChatState.profile.email || '').trim() &&
            String(supportChatState.profile.helpTopic || '').trim()
        );
    }

    function renderSupportChatHeader(session = null) {
        const titleEl = document.getElementById('supportChatHeaderTitle') || document.querySelector('.support-chat-header strong');
        if (!titleEl) return;

        const assignedAdmin = String(session?.assigned_admin_name || supportChatState.sessionMeta?.assigned_admin_name || '').trim();
        titleEl.textContent = assignedAdmin ? `EzFix Chat (${assignedAdmin})` : 'EzFix Chat';
    }

    function findAssignedAdminFromMessages(messages = []) {
        if (!Array.isArray(messages)) return '';

        for (let i = messages.length - 1; i >= 0; i -= 1) {
            const text = String(messages[i]?.message || '').trim();
            const match = text.match(/chat\s+převzal\s+admin\s+(.+?)[.!]?$/i) || text.match(/chat\s+prevzal\s+admin\s+(.+?)[.!]?$/i);
            if (match && match[1]) {
                return String(match[1]).trim();
            }
        }

        return '';
    }

    function updateSupportChatComposerState(session = null, messages = []) {
        const input = document.getElementById('supportChatInput');
        const form = document.getElementById('supportChatForm');
        if (!input || !form) return;

        const sendBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const statusClosed = String(session?.status || supportChatState.sessionMeta?.status || '').toLowerCase() === 'closed';
        const messageClosed = Array.isArray(messages) && messages.some((msg) => /chat byl ukoncen administratorem|chat byl ukončen administrátorem/i.test(String(msg?.message || '')));
        const isClosed = statusClosed || messageClosed;

        supportChatState.isClosed = isClosed;
        input.disabled = isClosed;
        if (sendBtn) sendBtn.disabled = isClosed;

        if (isClosed) {
            input.value = '';
            input.placeholder = 'Chat byl ukoncen administratorem.';
        }
    }

    function clearSupportChatLocalSession() {
        supportChatState.sessionId = '';
        supportChatState.lastSeenAdminMessageId = 0;
        supportChatState.serverUnreadCount = 0;
        supportChatState.typingActive = false;
        if (supportChatState.typingStopTimer) {
            clearTimeout(supportChatState.typingStopTimer);
            supportChatState.typingStopTimer = null;
        }
        if (supportChatState.pollId) {
            clearInterval(supportChatState.pollId);
            supportChatState.pollId = null;
        }
        supportChatState.isClosed = false;
        supportChatState.sessionMeta = null;
        supportChatState.onboardingStage = 'name';
        supportChatState.profile = { name: '', email: '', helpTopic: '' };
        localStorage.removeItem('supportChatSessionId');
        localStorage.removeItem('supportChatLastSeenAdminMessageId');
        localStorage.removeItem('supportChatName');
        localStorage.removeItem('supportChatEmail');
        localStorage.removeItem('supportChatHelpTopic');
        renderSupportChatHeader(null);
        renderSupportChatUnreadBadge(0);
    }

    async function ensureSupportChatSession() {
        const visitorId = localStorage.getItem('visitorId') || `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem('visitorId', visitorId);

        const result = await apiCall('POST', '/chat/session', {
            sessionId: supportChatState.sessionId,
            visitorId,
            name: supportChatState.profile.name || Storage.getUser()?.username || 'Visitor',
            email: supportChatState.profile.email || Storage.getUser()?.email || '',
            helpTopic: supportChatState.profile.helpTopic || ''
        });

        supportChatState.sessionId = result.sessionId;
        supportChatState.sessionMeta = result.session || null;
        localStorage.setItem('supportChatSessionId', supportChatState.sessionId);
        return supportChatState.sessionId;
    }

    async function loadSupportChatMessages(markReadUser = true) {
        if (!supportChatState.sessionId) return { messages: [], session: null };
        const readFlag = markReadUser ? '1' : '0';
        const result = await apiCall('GET', `/chat/messages/${supportChatState.sessionId}?markReadUser=${readFlag}`);
        supportChatState.sessionMeta = result.session || null;
        supportChatState.serverUnreadCount = Number(result.unreadUserCount || 0);
        return {
            messages: result.messages || [],
            session: result.session || null,
            unreadUserCount: Number(result.unreadUserCount || 0)
        };
    }

    function renderSupportChatMessages(messages, session = null) {
        const body = document.getElementById('supportChatBody');
        if (!body) return;
        body.innerHTML = '';
        let pendingRatingAdmin = '';
        const chatOpen = Boolean(document.getElementById('supportChat')?.classList.contains('open'));

        const sessionInfo = session || supportChatState.sessionMeta || null;
        const derivedAdmin = String(sessionInfo?.assigned_admin_name || '').trim() || findAssignedAdminFromMessages(messages || []);
        if (derivedAdmin) {
            supportChatState.sessionMeta = {
                ...(supportChatState.sessionMeta || {}),
                ...(sessionInfo || {}),
                assigned_admin_name: derivedAdmin
            };
        }

        renderSupportChatHeader(derivedAdmin ? { ...(sessionInfo || {}), assigned_admin_name: derivedAdmin } : sessionInfo);
        updateSupportChatComposerState(sessionInfo, messages || []);
        updateSupportChatUnread(messages || [], chatOpen, supportChatState.serverUnreadCount);

        if (!hasSupportChatProfile()) {
            const intro = document.createElement('div');
            intro.className = 'support-msg bot';
            intro.textContent = 'Ahoj, jsem EzFix AI asistent. Nejdřív vás provedu krátkým úvodem.';
            body.appendChild(intro);

            if (supportChatState.profile.name) {
                const nameAnswer = document.createElement('div');
                nameAnswer.className = 'support-msg user';
                nameAnswer.textContent = supportChatState.profile.name;
                body.appendChild(nameAnswer);
            }

            if (supportChatState.profile.name && supportChatState.profile.email) {
                const emailAnswer = document.createElement('div');
                emailAnswer.className = 'support-msg user';
                emailAnswer.textContent = supportChatState.profile.email;
                body.appendChild(emailAnswer);
            }

            const prompt = document.createElement('div');
            prompt.className = 'support-msg bot';
            if (!supportChatState.profile.name) {
                prompt.textContent = 'Jak se jmenujete?';
            } else if (!supportChatState.profile.email) {
                prompt.textContent = `Těší mě, ${supportChatState.profile.name}. Napište prosím e-mail.`;
            } else {
                prompt.textContent = 'S čím potřebujete pomoci? Napište: oprava, stav, cena, sestava, 3d, nebo jiné.';
            }
            body.appendChild(prompt);
            return;
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            const hello = document.createElement('div');
            hello.className = 'support-msg bot';
            hello.textContent = `Děkuji, ${supportChatState.profile.name}. Jsem EzFix AI asistent a pokusím se pomoci hned.`;

            const questions = document.createElement('div');
            questions.className = 'support-msg bot';
            questions.textContent = 'Napište prosím: 1) zařízení, 2) co přesně nefunguje, 3) od kdy problém trvá, 4) číslo objednávky (pokud máte).';

            body.appendChild(hello);
            body.appendChild(questions);
        }

        const assignedAdmin = derivedAdmin || '';
        if (assignedAdmin) {
            const assignment = document.createElement('div');
            assignment.className = 'support-msg bot';
            assignment.textContent = `Chat převzal admin ${assignedAdmin}. Odpověď dostanete co nejdříve.`;
            body.appendChild(assignment);
        }

        if (!Array.isArray(messages) || messages.length === 0) {
            body.scrollTop = body.scrollHeight;
            return;
        }

        messages.forEach((msg) => {
            const textValue = String(msg.message || '');
            const ratingTokenMatch = textValue.match(/^__RATE_ADMIN__:(.+)$/);
            if (ratingTokenMatch) {
                pendingRatingAdmin = String(ratingTokenMatch[1] || '').trim();
                return;
            }

            const type = msg.sender_type === 'admin' ? 'bot' : (msg.sender_type === 'bot' ? 'bot' : 'user');
            const item = document.createElement('div');
            item.className = `support-msg ${type}`;

            const textEl = document.createElement('div');
            textEl.textContent = textValue;
            item.appendChild(textEl);

            const metaEl = document.createElement('div');
            metaEl.className = 'support-msg-meta';
            if (msg.sender_type === 'bot') {
                metaEl.textContent = 'EzFix AI';
            } else if (msg.sender_type === 'admin') {
                metaEl.textContent = msg.sender_name || assignedAdmin || 'Admin';
            } else {
                metaEl.textContent = msg.sender_name || supportChatState.profile?.name || 'Vy';
            }
            item.appendChild(metaEl);

            body.appendChild(item);
        });

        const adminTyping = sessionInfo?.typing;
        if (adminTyping?.adminActive) {
            const typingMsg = document.createElement('div');
            typingMsg.className = 'support-msg bot typing';
            typingMsg.textContent = `${adminTyping.adminName || 'Admin'} typing...`;
            body.appendChild(typingMsg);
        }

        if (pendingRatingAdmin && supportChatState.sessionId) {
            openSupportRatingModal(pendingRatingAdmin, supportChatState.sessionId);
        }

        body.scrollTop = body.scrollHeight;
    }

    function refreshTakeChatButton(session) {
        const takeBtn = document.getElementById('adminTakeChatBtn');
        const closeBtn = document.getElementById('adminCloseChatBtn');
        if (!takeBtn) return;

        if (!session || !session.id) {
            takeBtn.style.display = 'none';
            takeBtn.dataset.sessionId = '';
            takeBtn.disabled = false;
            takeBtn.textContent = 'Převzít chat';
            if (closeBtn) {
                closeBtn.style.display = 'none';
                closeBtn.dataset.sessionId = '';
                closeBtn.textContent = 'Ukončit chat';
            }
            return;
        }

        takeBtn.dataset.sessionId = session.id;

        const assigned = String(session.assigned_admin_name || '').trim();
        const myName = String(Storage.getUser()?.username || '').trim();

        if (!assigned) {
            takeBtn.style.display = 'inline-flex';
            takeBtn.disabled = false;
            takeBtn.textContent = 'Převzít chat';
            if (closeBtn) {
                closeBtn.style.display = 'none';
                closeBtn.dataset.sessionId = '';
                closeBtn.textContent = 'Ukončit chat';
            }
            return;
        }

        takeBtn.style.display = 'inline-flex';
        const sessionStatus = String(session?.status || '').toLowerCase();
        if (sessionStatus === 'closed') {
            takeBtn.style.display = 'none';
            if (closeBtn) {
                closeBtn.style.display = 'inline-flex';
                closeBtn.dataset.sessionId = session.id;
                closeBtn.dataset.chatAction = 'delete';
                closeBtn.textContent = 'Smazat chat';
                closeBtn.classList.add('btn-danger');
                closeBtn.classList.remove('admin-chat-close-btn');
            }
            return;
        }

        if (closeBtn) {
            closeBtn.dataset.chatAction = 'close';
            closeBtn.classList.remove('btn-danger');
            closeBtn.classList.add('admin-chat-close-btn');
        }

        if (assigned === myName) {
            takeBtn.disabled = true;
            takeBtn.textContent = `Převzato vámi (${assigned})`;
            if (closeBtn) {
                closeBtn.style.display = 'inline-flex';
                closeBtn.dataset.sessionId = session.id;
                closeBtn.textContent = sessionStatus === 'awaiting_rating' ? 'Uzavřít trvale' : 'Ukončit chat';
            }
        } else {
            takeBtn.disabled = true;
            takeBtn.textContent = `Převzal ${assigned}`;
            if (closeBtn) {
                closeBtn.style.display = 'none';
                closeBtn.dataset.sessionId = '';
                closeBtn.textContent = 'Ukončit chat';
            }
        }
    }

    async function sendAdminTypingStatus(sessionId, isTyping) {
        if (!sessionId || !Storage.getToken() || !canAccessAdmin(Storage.getUser())) return;
        try {
            await apiCall('POST', `/chat/admin/sessions/${sessionId}/typing`, { isTyping: Boolean(isTyping) });
            adminChatState.typingActive = Boolean(isTyping);
        } catch {
            // ignore transient typing status failures
        }
    }

    function splitKeywordsInput(value) {
        return String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 30);
    }

    function joinKeywordsOutput(list) {
        return Array.isArray(list) ? list.join(', ') : '';
    }

    function fillAdminChatAiConfigForm(config = {}) {
        const emailKeywordsInput = document.getElementById('adminChatAiKeywordsEmail');
        const phoneKeywordsInput = document.getElementById('adminChatAiKeywordsPhone');
        const priceKeywordsInput = document.getElementById('adminChatAiKeywordsPrice');
        const repairKeywordsInput = document.getElementById('adminChatAiKeywordsRepair');
        const emailReplyInput = document.getElementById('adminChatAiReplyEmail');
        const phoneReplyInput = document.getElementById('adminChatAiReplyPhone');
        const priceReplyInput = document.getElementById('adminChatAiReplyPrice');
        const repairReplyInput = document.getElementById('adminChatAiReplyRepair');
        const fallbackReplyInput = document.getElementById('adminChatAiReplyFallback');

        if (emailKeywordsInput) emailKeywordsInput.value = joinKeywordsOutput(config?.email?.keywords);
        if (phoneKeywordsInput) phoneKeywordsInput.value = joinKeywordsOutput(config?.phone?.keywords);
        if (priceKeywordsInput) priceKeywordsInput.value = joinKeywordsOutput(config?.price?.keywords);
        if (repairKeywordsInput) repairKeywordsInput.value = joinKeywordsOutput(config?.repair?.keywords);

        if (emailReplyInput) emailReplyInput.value = String(config?.email?.reply || '');
        if (phoneReplyInput) phoneReplyInput.value = String(config?.phone?.reply || '');
        if (priceReplyInput) priceReplyInput.value = String(config?.price?.reply || '');
        if (repairReplyInput) repairReplyInput.value = String(config?.repair?.reply || '');
        if (fallbackReplyInput) fallbackReplyInput.value = String(config?.fallbackReply || '');
    }

    function collectAdminChatAiConfigForm() {
        const emailKeywordsInput = document.getElementById('adminChatAiKeywordsEmail');
        const phoneKeywordsInput = document.getElementById('adminChatAiKeywordsPhone');
        const priceKeywordsInput = document.getElementById('adminChatAiKeywordsPrice');
        const repairKeywordsInput = document.getElementById('adminChatAiKeywordsRepair');
        const emailReplyInput = document.getElementById('adminChatAiReplyEmail');
        const phoneReplyInput = document.getElementById('adminChatAiReplyPhone');
        const priceReplyInput = document.getElementById('adminChatAiReplyPrice');
        const repairReplyInput = document.getElementById('adminChatAiReplyRepair');
        const fallbackReplyInput = document.getElementById('adminChatAiReplyFallback');

        return {
            email: {
                keywords: splitKeywordsInput(emailKeywordsInput?.value),
                reply: String(emailReplyInput?.value || '').trim()
            },
            phone: {
                keywords: splitKeywordsInput(phoneKeywordsInput?.value),
                reply: String(phoneReplyInput?.value || '').trim()
            },
            price: {
                keywords: splitKeywordsInput(priceKeywordsInput?.value),
                reply: String(priceReplyInput?.value || '').trim()
            },
            repair: {
                keywords: splitKeywordsInput(repairKeywordsInput?.value),
                reply: String(repairReplyInput?.value || '').trim()
            },
            fallbackReply: String(fallbackReplyInput?.value || '').trim()
        };
    }

    async function loadAdminChatAiConfig(forceReload = false) {
        if (!Storage.getToken() || !canAccessAdmin(Storage.getUser())) return;
        if (!forceReload && adminChatState.aiConfigLoaded) return;
        if (adminChatState.aiConfigLoading) return;

        const reloadBtn = document.getElementById('adminChatAiReloadBtn');
        adminChatState.aiConfigLoading = true;
        if (reloadBtn) reloadBtn.disabled = true;

        try {
            const result = await apiCall('GET', '/chat/admin/ai-config');
            if (!result?.success || !result?.config) {
                throw new Error(result?.message || 'Failed to load AI config');
            }

            fillAdminChatAiConfigForm(result.config);
            adminChatState.aiConfigLoaded = true;
        } catch (err) {
            console.error('Load admin chat AI config failed:', err);
            showToast(err?.message || 'Failed to load AI answers');
        } finally {
            adminChatState.aiConfigLoading = false;
            if (reloadBtn) reloadBtn.disabled = false;
        }
    }

    async function saveAdminChatAiConfig() {
        if (!Storage.getToken() || !canAccessAdmin(Storage.getUser())) return;
        if (adminChatState.aiConfigSaving) return;

        const saveBtn = document.getElementById('adminChatAiSaveBtn');
        adminChatState.aiConfigSaving = true;
        if (saveBtn) saveBtn.disabled = true;

        try {
            const payload = collectAdminChatAiConfigForm();
            const result = await apiCall('PUT', '/chat/admin/ai-config', payload);
            if (!result?.success) {
                throw new Error(result?.message || 'Failed to save AI config');
            }

            fillAdminChatAiConfigForm(result.config || payload);
            adminChatState.aiConfigLoaded = true;
            showToast('AI bot answers saved');
        } catch (err) {
            console.error('Save admin chat AI config failed:', err);
            showToast(err?.message || 'Failed to save AI answers');
        } finally {
            adminChatState.aiConfigSaving = false;
            if (saveBtn) saveBtn.disabled = false;
        }
    }

    function getAdminChatStatusKind(session) {
        const rawStatus = String(session?.status || '').trim().toLowerCase();
        const hasAssignedAdmin = Boolean(String(session?.assigned_admin_name || '').trim());

        if (rawStatus === 'closed') return 'closed';
        if (hasAssignedAdmin) return 'taken_active';
        return 'open_unassigned';
    }

    function getOpenUnassignedChatCount() {
        return (adminChatState.sessions || []).filter((session) => getAdminChatStatusKind(session) === 'open_unassigned').length;
    }

    function renderAdminChatOpenCount() {
        const openCountEl = document.getElementById('adminChatOpenCount');
        if (!openCountEl) return;

        const count = getOpenUnassignedChatCount();
        if (count <= 0) {
            openCountEl.style.display = 'none';
            openCountEl.textContent = '0';
        } else {
            openCountEl.style.display = 'inline-flex';
            openCountEl.textContent = count > 99 ? '99+' : String(count);
        }

        updateChatTabBadge();
    }

    function updateChatTabBadge() {
        const tabBadge = document.getElementById('chatTabBadge');
        if (!tabBadge) return;

        const count = getOpenUnassignedChatCount();
        if (count <= 0) {
            tabBadge.style.display = 'none';
            tabBadge.textContent = '0';
        } else {
            tabBadge.style.display = 'inline-block';
            tabBadge.textContent = count > 99 ? '99+' : String(count);
        }
    }

    function getFilteredAdminChatSessions() {
        const statusFilter = String(adminChatState.statusFilter || 'all');
        const adminFilter = String(adminChatState.adminFilter || 'all').trim().toLowerCase();

        return (adminChatState.sessions || []).filter((session) => {
            const statusKind = getAdminChatStatusKind(session);
            // Hide closed chats from the 'all' view — they only appear in the 'closed' filter
            if (statusFilter === 'all' && statusKind === 'closed') {
                return false;
            }
            if (statusFilter !== 'all' && statusKind !== statusFilter) {
                return false;
            }

            if (adminFilter !== 'all') {
                const assigned = String(session?.assigned_admin_name || '').trim().toLowerCase();
                if (assigned !== adminFilter) {
                    return false;
                }
            }

            return true;
        });
    }

    function renderAdminChatAdminFilterOptions() {
        const adminFilterEl = document.getElementById('adminChatAdminFilter');
        if (!adminFilterEl) return;

        const previousValue = String(adminChatState.adminFilter || 'all');
        const usersFromApi = (adminChatState.adminUsers || [])
            .map((name) => String(name || '').trim())
            .filter(Boolean);
        const usersFromSessions = (adminChatState.sessions || [])
            .map((session) => String(session?.assigned_admin_name || '').trim())
            .filter(Boolean);

        const uniqueAdmins = [...new Set([...usersFromApi, ...usersFromSessions])]
            .sort((a, b) => a.localeCompare(b, 'cs', { sensitivity: 'base' }));

        const optionsHtml = [
            '<option value="all">Všichni admini</option>',
            ...uniqueAdmins.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`)
        ].join('');

        adminFilterEl.innerHTML = optionsHtml;
        const hasPrevious = previousValue === 'all' || uniqueAdmins.some((name) => name.toLowerCase() === previousValue.toLowerCase());
        adminChatState.adminFilter = hasPrevious ? previousValue : 'all';
        adminFilterEl.value = adminChatState.adminFilter === 'all'
            ? 'all'
            : (uniqueAdmins.find((name) => name.toLowerCase() === adminChatState.adminFilter.toLowerCase()) || 'all');
    }

    async function loadAdminChatSessions() {
        if (!Storage.getToken() || !canAccessAdmin(Storage.getUser())) return;

        try {
            const result = await apiCall('GET', '/chat/admin/sessions');
            adminChatState.loadErrorVisible = false;
            adminChatState.sessions = result.sessions || [];
            adminChatState.adminUsers = Array.isArray(result.admins) ? result.admins : [];
            renderAdminChatAdminFilterOptions();
            renderAdminChatOpenCount();
            renderAdminChatSessionList();

            const hasActiveSession = (adminChatState.sessions || []).some((session) => session.id === adminChatState.activeSessionId);
            if (!hasActiveSession) {
                adminChatState.activeSessionId = null;
            }

            const filteredSessions = getFilteredAdminChatSessions();
            if (!adminChatState.activeSessionId && filteredSessions.length > 0) {
                await openAdminChatSession(filteredSessions[0].id);
            }
        } catch (err) {
            console.error('Load admin chat sessions failed:', err);
            if (!adminChatState.loadErrorVisible) {
                showToast('Admin chat list failed to load. Please refresh and try again.');
                adminChatState.loadErrorVisible = true;
            }
        }
    }

    function renderAdminChatSessionList() {
        const sessionsEl = document.getElementById('adminChatSessions');
        if (!sessionsEl) return;

        const sessions = getFilteredAdminChatSessions();
        const totalSessions = (adminChatState.sessions || []).length;
        renderAdminChatOpenCount();
        if (!sessions.length) {
            if (totalSessions > 0) {
                sessionsEl.innerHTML = '<div class="admin-chat-empty">No chats for selected filters. <button type="button" class="btn btn-sm btn-secondary" data-chat-reset-filters>Reset filters</button></div>';
            } else {
                sessionsEl.innerHTML = '<div class="admin-chat-empty">No chats for selected filters.</div>';
            }
            refreshTakeChatButton(null);
            return;
        }

        sessionsEl.innerHTML = sessions.map((session) => {
            const unread = Number(session.unread_count || 0);
            const title = escapeHtml(session.customer_name || session.customer_email || session.id || 'Session');
            const email = escapeHtml(session.customer_email || '');
            const helpTopic = escapeHtml(getHelpTopicLabel(session.help_topic || ''));
            const preview = escapeHtml(String(session.last_message || '').slice(0, 68));
            const rawAssigned = String(session.assigned_admin_name || '').trim();
            const assigned = escapeHtml(rawAssigned);
            const currentAdminName = String(Storage.getUser()?.username || '').trim();
            const activeClass = session.id === adminChatState.activeSessionId ? 'active' : '';

            let assignAction = `<button type="button" class="btn btn-sm btn-secondary admin-chat-assign-btn" data-chat-assign="${escapeHtml(session.id)}">Převzít chat</button>`;
            if (rawAssigned) {
                if (rawAssigned === currentAdminName) {
                    assignAction = `<button type="button" class="btn btn-sm btn-secondary admin-chat-assign-btn" disabled>Převzato vámi</button>`;
                } else {
                    assignAction = `<button type="button" class="btn btn-sm btn-secondary admin-chat-assign-btn" disabled>Převzal ${assigned}</button>`;
                }
            }

            return `
                <div class="admin-chat-session-item ${activeClass}" data-chat-session-id="${escapeHtml(session.id)}" role="button" tabindex="0">
                    <div class="admin-chat-session-top">
                        <strong>${title}</strong>
                        ${unread > 0 ? `<span class="admin-chat-badge">${unread}</span>` : ''}
                    </div>
                    ${assigned ? `<div class="admin-chat-session-meta">Assigned: ${assigned}</div>` : ''}
                    ${(email || helpTopic) ? `<div class="admin-chat-session-meta">${email}${email && helpTopic ? ' • ' : ''}${helpTopic}</div>` : ''}
                    <div class="admin-chat-session-last">${preview || 'No messages yet'}</div>
                    <div class="admin-chat-session-actions">${assignAction}</div>
                </div>
            `;
        }).join('');
    }

    function renderAdminChatThread(messages, session) {
        const headerEl = document.getElementById('adminChatThreadHeader');
        const messagesEl = document.getElementById('adminChatMessages');
        if (!headerEl || !messagesEl) return;

        const customerName = String(session?.customer_name || '').trim();
        const customerEmail = String(session?.customer_email || '').trim();
        const label = customerName || customerEmail || session?.id || 'Chat session';
        const topic = getHelpTopicLabel(session?.help_topic || '');
        const assigned = session?.assigned_admin_name ? ` • Assigned: ${session.assigned_admin_name}` : '';
        const identity = customerName && customerEmail ? `${customerName} <${customerEmail}>` : label;
        headerEl.textContent = topic ? `Chat: ${identity} (${topic})${assigned}` : `Chat: ${identity}${assigned}`;
        refreshTakeChatButton(session || null);

        messagesEl.innerHTML = (messages || []).map((msg) => {
            const sender = msg.sender_type === 'admin' ? 'admin' : (msg.sender_type === 'bot' ? 'bot' : 'user');
            const senderLabel = msg.sender_name ? escapeHtml(msg.sender_name) : escapeHtml(msg.sender_type || 'message');
            const text = escapeHtml(msg.message || '');
            const when = formatChatTime(msg.created_at);
            return `
                <div class="admin-chat-msg ${sender}">
                    <div>${text}</div>
                    <div class="admin-chat-msg-meta">${senderLabel}${when ? ` • ${when}` : ''}</div>
                </div>
            `;
        }).join('');

        if (session?.typing?.userActive) {
            const typingName = escapeHtml(session.typing.userName || customerName || 'Uživatel');
            messagesEl.insertAdjacentHTML('beforeend', `
                <div class="admin-chat-msg user typing">
                    <div>${typingName} typing...</div>
                </div>
            `);
        }

        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function openAdminChatSession(sessionId) {
        if (!sessionId) return;
        adminChatState.activeSessionId = sessionId;
        renderAdminChatSessionList();

        const result = await apiCall('GET', `/chat/admin/sessions/${sessionId}/messages`);
        renderAdminChatThread(result.messages || [], result.session || { id: sessionId });
    }

    function initSupportChat() {
        const chatRoot = document.getElementById('supportChat');
        const toggleBtn = document.getElementById('supportChatToggle');
        const closeBtn = document.getElementById('supportChatClose');
        const panel = document.getElementById('supportChatPanel');
        const form = document.getElementById('supportChatForm');
        const input = document.getElementById('supportChatInput');
        const body = document.getElementById('supportChatBody');
        const closeConfirmModal = document.getElementById('chatCloseConfirm');
        const closeConfirmBackdrop = document.getElementById('chatCloseConfirmBackdrop');
        const closeConfirmCancel = document.getElementById('chatCloseConfirmCancel');
        const closeConfirmOk = document.getElementById('chatCloseConfirmOk');

        if (!chatRoot || !toggleBtn || !closeBtn || !panel || !form || !input || !body) return;

        initSupportRatingUi();

        let closeConfirmResolver = null;

        const resolveCloseConfirm = (value) => {
            if (!closeConfirmModal || !closeConfirmResolver) return;
            closeConfirmModal.classList.remove('show');
            closeConfirmModal.setAttribute('aria-hidden', 'true');
            const resolver = closeConfirmResolver;
            closeConfirmResolver = null;
            resolver(Boolean(value));
        };

        const promptCloseAndClearChat = () => {
            if (!closeConfirmModal) {
                return Promise.resolve(window.confirm('Do you want to close and clear this chat window for this user?'));
            }

            if (closeConfirmResolver) {
                resolveCloseConfirm(false);
            }

            closeConfirmModal.classList.add('show');
            closeConfirmModal.setAttribute('aria-hidden', 'false');
            closeConfirmCancel?.focus();

            return new Promise((resolve) => {
                closeConfirmResolver = resolve;
            });
        };

        closeConfirmBackdrop?.addEventListener('click', () => resolveCloseConfirm(false));
        closeConfirmCancel?.addEventListener('click', () => resolveCloseConfirm(false));
        closeConfirmOk?.addEventListener('click', () => resolveCloseConfirm(true));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && closeConfirmModal?.classList.contains('show')) {
                event.preventDefault();
                resolveCloseConfirm(false);
            }
        });

        const syncOnboardingPlaceholder = () => {
            if (hasSupportChatProfile()) {
                supportChatState.onboardingStage = 'done';
                input.placeholder = 'Napis zpravu...';
                input.maxLength = 220;
                return;
            }

            if (!supportChatState.profile.name) {
                supportChatState.onboardingStage = 'name';
                input.placeholder = 'Napište své jméno';
                input.maxLength = 80;
                return;
            }

            if (!supportChatState.profile.email) {
                supportChatState.onboardingStage = 'email';
                input.placeholder = 'Napište svůj e-mail';
                input.maxLength = 120;
                return;
            }

            if (!supportChatState.profile.helpTopic) {
                supportChatState.onboardingStage = 'topic';
                input.placeholder = 'Téma: oprava / stav / cena / sestava / 3d / jiné';
                input.maxLength = 60;
                return;
            }

            supportChatState.onboardingStage = 'done';
            input.placeholder = 'Napis zpravu...';
            input.maxLength = 220;
        };

        const processOnboardingStep = async (text) => {
            if (supportChatState.onboardingStage === 'name') {
                supportChatState.profile.name = text;
                saveSupportChatProfile();
                syncOnboardingPlaceholder();
                renderSupportChatMessages([], null);
                return true;
            }

            if (supportChatState.onboardingStage === 'email') {
                const email = String(text || '').trim().toLowerCase();
                const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                if (!emailOk) {
                    showToast('Zadejte prosím platný e-mail.');
                    return true;
                }
                supportChatState.profile.email = email;
                saveSupportChatProfile();
                syncOnboardingPlaceholder();
                renderSupportChatMessages([], null);
                return true;
            }

            if (supportChatState.onboardingStage === 'topic') {
                const topic = parseHelpTopicValue(text);
                if (!topic) {
                    showToast('Napište prosím jedno z témat: oprava, stav, cena, sestava, 3d, jiné.');
                    return true;
                }

                supportChatState.profile.helpTopic = topic;
                saveSupportChatProfile();
                syncOnboardingPlaceholder();

                await ensureSupportChatSession();
                const result = await loadSupportChatMessages(true);
                renderSupportChatMessages(result.messages || [], result.session || null);
                return true;
            }

            return false;
        };

        const pollSupportChat = async () => {
            try {
                if (!supportChatState.sessionId) return;
                const isOpen = Boolean(document.getElementById('supportChat')?.classList.contains('open'));
                const result = await loadSupportChatMessages(isOpen);
                renderSupportChatMessages(result.messages || [], result.session || null);
            } catch {
                // ignore polling failures
            }
        };

        // Keep accessibility state aligned for both visibility and focus handling.
        panel.inert = true;

        const openChat = async () => {
            chatRoot.classList.add('open');
            panel.inert = false;
            panel.setAttribute('aria-hidden', 'false');
            toggleBtn.setAttribute('aria-expanded', 'true');
            syncOnboardingPlaceholder();

            try {
                if (hasSupportChatProfile()) {
                    await ensureSupportChatSession();
                    const result = await loadSupportChatMessages(true);
                    renderSupportChatMessages(result.messages || [], result.session || null);
                } else {
                    renderSupportChatMessages([], null);
                }
            } catch (err) {
                console.error('Support chat init failed:', err);
            }

            input.focus();

            if (!supportChatState.pollId) {
                supportChatState.pollId = setInterval(pollSupportChat, 3000);
            }
        };

        const closeChat = () => {
            const activeElement = document.activeElement;
            if (activeElement && panel.contains(activeElement)) {
                toggleBtn.focus();
            }

            chatRoot.classList.remove('open');
            panel.inert = true;
            panel.setAttribute('aria-hidden', 'true');
            toggleBtn.setAttribute('aria-expanded', 'false');
        };

        const handleSupportTypingInput = async () => {
            const text = String(input.value || '').trim();
            if (!supportChatState.sessionId || !hasSupportChatProfile()) return;

            if (text && !supportChatState.typingActive) {
                await sendSupportTypingStatus(true);
            }

            if (!text && supportChatState.typingActive) {
                await sendSupportTypingStatus(false);
            }

            if (supportChatState.typingStopTimer) {
                clearTimeout(supportChatState.typingStopTimer);
            }

            if (text) {
                supportChatState.typingStopTimer = setTimeout(() => {
                    sendSupportTypingStatus(false);
                }, 1500);
            }
        };

        const closeAndResetChat = async () => {
            const confirmed = await promptCloseAndClearChat();
            if (!confirmed) return;

            if (supportChatState.typingActive) {
                await sendSupportTypingStatus(false);
            }

            clearSupportChatLocalSession();
            body.innerHTML = '';
            input.value = '';
            syncOnboardingPlaceholder();
            closeChat();
        };

        toggleBtn.addEventListener('click', () => {
            if (chatRoot.classList.contains('open')) closeChat();
            else openChat();
        });

        closeBtn.addEventListener('click', closeAndResetChat);
        input.addEventListener('input', handleSupportTypingInput);
        input.addEventListener('blur', () => {
            if (supportChatState.typingActive) {
                sendSupportTypingStatus(false);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (supportChatState.submitInFlight) return;
            if (supportChatState.isClosed) {
                showToast('Tento chat byl ukončen administrátorem.');
                return;
            }
            const text = (input.value || '').trim();
            if (!text) return;

            try {
                supportChatState.submitInFlight = true;
                const onboardingHandled = await processOnboardingStep(text);
                if (onboardingHandled) {
                    input.value = '';
                    input.focus();

                    if (hasSupportChatProfile() && !supportChatState.pollId) {
                        supportChatState.pollId = setInterval(pollSupportChat, 3000);
                    }
                    return;
                }

                if (!supportChatState.sessionId) {
                    await ensureSupportChatSession();
                }
                const result = await apiCall('POST', `/chat/messages/${supportChatState.sessionId}`, {
                    message: text,
                    senderName: supportChatState.profile.name || Storage.getUser()?.username || 'Visitor'
                });
                if (supportChatState.typingActive) {
                    await sendSupportTypingStatus(false);
                }
                input.value = '';
                supportChatState.sessionMeta = result.session || supportChatState.sessionMeta;
                renderSupportChatMessages(result.messages || [], result.session || null);
            } catch (err) {
                console.error('Support chat send failed:', err);
                showToast('Failed to send message');
            } finally {
                supportChatState.submitInFlight = false;
            }
        });

        syncOnboardingPlaceholder();

        if (!supportChatState.pollId) {
            supportChatState.pollId = setInterval(pollSupportChat, 3000);
        }
    }

    function initAdminChatInbox() {
        const sessionsEl = document.getElementById('adminChatSessions');
        const replyForm = document.getElementById('adminChatReplyForm');
        const replyInput = document.getElementById('adminChatReplyInput');
        const takeChatBtn = document.getElementById('adminTakeChatBtn');
        const closeChatBtn = document.getElementById('adminCloseChatBtn');
        const statusFilterEl = document.getElementById('adminChatStatusFilter');
        const adminFilterEl = document.getElementById('adminChatAdminFilter');
        const takeModal = document.getElementById('adminChatTakeModal');
        const takeBackdrop = document.getElementById('adminChatTakeBackdrop');
        const takeCancelBtn = document.getElementById('adminChatTakeCancel');
        const takeConfirmBtn = document.getElementById('adminChatTakeConfirm');
        const takeName = document.getElementById('adminChatTakeName');
        const takeEmail = document.getElementById('adminChatTakeEmail');
        const closeConfirmModal = document.getElementById('adminChatCloseConfirm');
        const closeConfirmBackdrop = document.getElementById('adminChatCloseConfirmBackdrop');
        const closeConfirmCancel = document.getElementById('adminChatCloseConfirmCancel');
        const closeConfirmOk = document.getElementById('adminChatCloseConfirmOk');
        const aiReloadBtn = document.getElementById('adminChatAiReloadBtn');
        const aiSaveBtn = document.getElementById('adminChatAiSaveBtn');

        let takeModalSessionId = '';
        let closeConfirmResolver = null;

        const clearAdminChatThread = () => {
            const headerEl = document.getElementById('adminChatThreadHeader');
            const messagesEl = document.getElementById('adminChatMessages');
            if (headerEl) headerEl.textContent = 'Select a chat session';
            if (messagesEl) messagesEl.innerHTML = '<div class="admin-chat-empty">No active chat selected.</div>';
            refreshTakeChatButton(null);
        };

        const handleAdminTypingInput = async () => {
            const sessionId = adminChatState.activeSessionId;
            if (!sessionId) return;

            const text = String(replyInput?.value || '').trim();
            if (text && !adminChatState.typingActive) {
                await sendAdminTypingStatus(sessionId, true);
            }

            if (!text && adminChatState.typingActive) {
                await sendAdminTypingStatus(sessionId, false);
            }

            if (adminChatState.typingStopTimer) {
                clearTimeout(adminChatState.typingStopTimer);
            }

            if (text) {
                adminChatState.typingStopTimer = setTimeout(() => {
                    sendAdminTypingStatus(sessionId, false);
                }, 1500);
            }
        };

        const hideTakeModal = () => {
            if (!takeModal) return;
            takeModal.classList.remove('show');
            takeModal.setAttribute('aria-hidden', 'true');
            takeModalSessionId = '';
        };

        const showTakeModal = (sessionId) => {
            if (!takeModal || !sessionId) return;
            const session = (adminChatState.sessions || []).find((item) => item.id === sessionId);
            takeModalSessionId = sessionId;
            if (takeName) takeName.textContent = session?.customer_name || 'Návštěvník';
            if (takeEmail) takeEmail.textContent = session?.customer_email || '-';
            takeModal.classList.add('show');
            takeModal.setAttribute('aria-hidden', 'false');
        };

        const resolveCloseConfirm = (value) => {
            if (!closeConfirmModal || !closeConfirmResolver) return;
            closeConfirmModal.classList.remove('show');
            closeConfirmModal.setAttribute('aria-hidden', 'true');
            const resolver = closeConfirmResolver;
            closeConfirmResolver = null;
            resolver(Boolean(value));
        };

        const promptCloseChatConfirm = () => {
            if (!closeConfirmModal) {
                return Promise.resolve(window.confirm('Opravdu chcete tento chat uzavřít?'));
            }

            if (closeConfirmResolver) {
                resolveCloseConfirm(false);
            }

            closeConfirmModal.classList.add('show');
            closeConfirmModal.setAttribute('aria-hidden', 'false');
            closeConfirmCancel?.focus();

            return new Promise((resolve) => {
                closeConfirmResolver = resolve;
            });
        };

        const takeChatSession = async (sessionId) => {
            if (!sessionId) return;

            const result = await apiCall('POST', `/chat/admin/sessions/${sessionId}/take`, {});
            if (!result?.success) {
                throw new Error(result?.message || 'Nepodařilo se převzít chat');
            }

            showToast(`Chat převzal ${result.session?.assigned_admin_name || 'aktuální admin'}`);
            await loadAdminChatSessions();

            const filteredSessions = getFilteredAdminChatSessions();
            const stillVisible = filteredSessions.some((session) => session.id === sessionId);
            if (stillVisible) {
                await openAdminChatSession(sessionId);
                return;
            }

            adminChatState.activeSessionId = null;
            if (filteredSessions.length > 0) {
                await openAdminChatSession(filteredSessions[0].id);
            } else {
                clearAdminChatThread();
            }
        };

        const closeChatSession = async (sessionId) => {
            if (!sessionId) return;

            const confirmed = await promptCloseChatConfirm();
            if (!confirmed) return;

            const result = await apiCall('POST', `/chat/admin/sessions/${sessionId}/close`, {});
            if (!result?.success) {
                throw new Error(result?.message || 'Failed to close chat');
            }

            const isFinalClose = String(result.phase || '').toLowerCase() === 'final';
            if (isFinalClose) {
                // Session is now 'closed' — move away from it in the current filter
                if (adminChatState.activeSessionId === sessionId) {
                    adminChatState.activeSessionId = null;
                    clearAdminChatThread();
                }
                showToast('Chat uzavřen. Najdete ho ve filtru Uzavřené.');
            } else {
                showToast('Chat je ukončen pro uživatele. Čeká se na hodnocení.');
            }

            await loadAdminChatSessions();
            if (!isFinalClose && adminChatState.activeSessionId === sessionId) {
                await openAdminChatSession(sessionId);
            } else if (isFinalClose) {
                const filteredSessions = getFilteredAdminChatSessions();
                if (filteredSessions.length > 0) {
                    await openAdminChatSession(filteredSessions[0].id);
                }
            }
        };

        const deleteClosedChatSession = async (sessionId) => {
            if (!sessionId) return;

            const confirmed = await promptCloseChatConfirm();
            if (!confirmed) return;

            await apiCall('DELETE', `/chat/admin/sessions/${sessionId}`);

            adminChatState.sessions = (adminChatState.sessions || []).filter((s) => s.id !== sessionId);
            if (adminChatState.activeSessionId === sessionId) {
                adminChatState.activeSessionId = null;
                clearAdminChatThread();
            }
            renderAdminChatSessionList();
            showToast('Chat byl trvale smazán.');

            const filteredSessions = getFilteredAdminChatSessions();
            if (filteredSessions.length > 0) {
                await openAdminChatSession(filteredSessions[0].id);
            }
        };

        closeConfirmBackdrop?.addEventListener('click', () => resolveCloseConfirm(false));
        closeConfirmCancel?.addEventListener('click', () => resolveCloseConfirm(false));
        closeConfirmOk?.addEventListener('click', () => resolveCloseConfirm(true));

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && closeConfirmModal?.classList.contains('show')) {
                event.preventDefault();
                resolveCloseConfirm(false);
            }
        });

        sessionsEl?.addEventListener('click', async (event) => {
            const resetFiltersBtn = event.target.closest('[data-chat-reset-filters]');
            if (resetFiltersBtn) {
                adminChatState.statusFilter = 'all';
                adminChatState.adminFilter = 'all';
                const statusFilterEl = document.getElementById('adminChatStatusFilter');
                const adminFilterEl = document.getElementById('adminChatAdminFilter');
                if (statusFilterEl) statusFilterEl.value = 'all';
                if (adminFilterEl) adminFilterEl.value = 'all';
                renderAdminChatSessionList();
                const allSessions = getFilteredAdminChatSessions();
                if (!adminChatState.activeSessionId && allSessions.length > 0) {
                    await openAdminChatSession(allSessions[0].id);
                }
                return;
            }

            const assignBtn = event.target.closest('[data-chat-assign]');
            if (assignBtn) {
                const sessionId = assignBtn.getAttribute('data-chat-assign');
                if (!sessionId) return;
                try {
                    showTakeModal(sessionId);
                } catch (err) {
                    showToast(err?.message || 'Nepodařilo se převzít chat');
                }
                return;
            }

            const item = event.target.closest('[data-chat-session-id]');
            if (!item) return;
            const sessionId = item.getAttribute('data-chat-session-id');
            if (!sessionId) return;
            try {
                if (adminChatState.typingActive && adminChatState.activeSessionId && adminChatState.activeSessionId !== sessionId) {
                    await sendAdminTypingStatus(adminChatState.activeSessionId, false);
                }
                await openAdminChatSession(sessionId);
                await loadAdminChatSessions();
            } catch (err) {
                console.error('Open admin chat session failed:', err);
            }
        });

        replyForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = (replyInput?.value || '').trim();
            if (!message || !adminChatState.activeSessionId) return;

            try {
                const result = await apiCall('POST', `/chat/admin/sessions/${adminChatState.activeSessionId}/reply`, { message });
                if (adminChatState.typingActive) {
                    await sendAdminTypingStatus(adminChatState.activeSessionId, false);
                }
                if (replyInput) replyInput.value = '';
                const session = adminChatState.sessions.find(s => s.id === adminChatState.activeSessionId) || { id: adminChatState.activeSessionId };
                renderAdminChatThread(result.messages || [], session);
                await loadAdminChatSessions();
            } catch (err) {
                console.error('Admin chat reply failed:', err);
                showToast('Failed to send admin reply');
            }
        });

        takeChatBtn?.addEventListener('click', async () => {
            const sessionId = takeChatBtn.dataset.sessionId || adminChatState.activeSessionId;
            if (!sessionId) return;

            showTakeModal(sessionId);
        });

        takeBackdrop?.addEventListener('click', hideTakeModal);
        takeCancelBtn?.addEventListener('click', hideTakeModal);
        takeConfirmBtn?.addEventListener('click', async () => {
            if (!takeModalSessionId) return;

            try {
                await takeChatSession(takeModalSessionId);
                hideTakeModal();
            } catch (err) {
                showToast(err?.message || 'Nepodařilo se převzít chat');
            }
        });

        closeChatBtn?.addEventListener('click', async () => {
            const sessionId = closeChatBtn.dataset.sessionId || adminChatState.activeSessionId;
            if (!sessionId) return;

            const action = closeChatBtn.dataset.chatAction || 'close';
            try {
                if (action === 'delete') {
                    await deleteClosedChatSession(sessionId);
                } else {
                    await closeChatSession(sessionId);
                }
            } catch (err) {
                showToast(err?.message || 'Failed to close chat');
            }
        });

        aiReloadBtn?.addEventListener('click', async () => {
            await loadAdminChatAiConfig(true);
        });

        aiSaveBtn?.addEventListener('click', async () => {
            await saveAdminChatAiConfig();
        });

        statusFilterEl?.addEventListener('change', async () => {
            adminChatState.statusFilter = String(statusFilterEl.value || 'all');
            renderAdminChatSessionList();

            const filteredSessions = getFilteredAdminChatSessions();
            const activeVisible = filteredSessions.some((session) => session.id === adminChatState.activeSessionId);
            if (!activeVisible) {
                adminChatState.activeSessionId = null;
                if (filteredSessions.length > 0) {
                    await openAdminChatSession(filteredSessions[0].id);
                } else {
                    clearAdminChatThread();
                }
            }
        });

        adminFilterEl?.addEventListener('change', async () => {
            adminChatState.adminFilter = String(adminFilterEl.value || 'all').trim().toLowerCase();
            renderAdminChatSessionList();

            const filteredSessions = getFilteredAdminChatSessions();
            const activeVisible = filteredSessions.some((session) => session.id === adminChatState.activeSessionId);
            if (!activeVisible) {
                adminChatState.activeSessionId = null;
                if (filteredSessions.length > 0) {
                    await openAdminChatSession(filteredSessions[0].id);
                } else {
                    clearAdminChatThread();
                }
            }
        });

        replyInput?.addEventListener('input', handleAdminTypingInput);
        replyInput?.addEventListener('blur', () => {
            const sessionId = adminChatState.activeSessionId;
            if (sessionId && adminChatState.typingActive) {
                sendAdminTypingStatus(sessionId, false);
            }
        });

        if (adminChatState.pollId) clearInterval(adminChatState.pollId);
        adminChatState.pollId = setInterval(async () => {
            if (!Storage.getToken() || !canAccessAdmin(Storage.getUser())) return;
            const chatsTabActive = document.getElementById('chats-content')?.classList.contains('active');
            if (!chatsTabActive) return;
            await loadAdminChatSessions();
            if (adminChatState.activeSessionId) {
                try {
                    const result = await apiCall('GET', `/chat/admin/sessions/${adminChatState.activeSessionId}/messages`);
                    const session = adminChatState.sessions.find(s => s.id === adminChatState.activeSessionId) || result.session;
                    renderAdminChatThread(result.messages || [], session);
                } catch {
                    // ignore poll failures
                }
            }
        }, 3000);

        const chatsTabActive = document.getElementById('chats-content')?.classList.contains('active');
        if (chatsTabActive) {
            loadAdminChatSessions();
            loadAdminChatAiConfig();
        }
    }

    let adminChatInboxInitialized = false;
    function ensureAdminChatInboxInitialized() {
        if (adminChatInboxInitialized) return;
        adminChatInboxInitialized = true;
        initAdminChatInbox();
    }

    let presenceTrackingStarted = false;
    function startPresenceTrackingDeferred() {
        if (presenceTrackingStarted) return;
        presenceTrackingStarted = true;

        const begin = async () => {
            try {
                await sendPresenceHeartbeat();
                setInterval(sendPresenceHeartbeat, 45 * 1000);
                setInterval(refreshActiveVisitorsStat, 30 * 1000);
            } catch (err) {
                console.warn('Presence tracking start failed:', err?.message || err);
            }
        };

        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => {
                begin();
            }, { timeout: 3500 });
            return;
        }

        setTimeout(() => {
            begin();
        }, 2500);
    }

    initSupportChat();
    initHomeNewsUi();
    renderHomeNewsSection(newsItems);

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    (async () => {
        try {
            initCookieConsent();
            await loadCatalog();
            await refreshAuthState();
            updateAuthUI();
            hideLoginModal();
            updateCartCount();
            updateCheckoutPickupFeeUi();
            renderTermsModalContent();
            applyTranslations();
            if (window.location.hash) {
                handleHashNavigation();
            } else {
                showPage('home');
            }
            if (document.getElementById('printing')?.classList.contains('active')) {
                renderPrintingPage();
            }
            if (!catalogState || !catalogState.announcement) {
                renderAnnouncementBanner({ active: false, text: '' });
            }
            startPresenceTrackingDeferred();
        } catch (initError) {
            console.error('Initialization error:', initError);
            updateAuthUI();
            applyTranslations();
            showPage('home');
            initCookieConsent();
            startPresenceTrackingDeferred();
        } finally {
            hideStartupLoader();
        }
    })();

    window.addEventListener('hashchange', () => {
        handleHashNavigation();
        ensureVisiblePage();
    });

    // Admin access via F12 console (hint removed)
    window.adminAccess = () => { showSupportDialog(); };
});

// ========================================================================
// GLOBAL EMAIL FUNCTIONS (Outside DOMContentLoaded for onclick access)
// ========================================================================

/**
 * Email customer dialog
 * @param {number} orderId - Order ID
 * @param {string} customerEmail - Customer email
 * @param {string} customerName - Customer name
 */
async function emailCustomer(orderId, customerEmail, customerName) {
    const translate = (typeof window !== 'undefined' && typeof window.t === 'function')
        ? window.t
        : (text) => text;
    // Store the current order ID and show the email modal
    window.currentEmailOrderId = orderId;
    window.currentCustomerEmail = customerEmail;
    
    // Populate the form
    const draft = (typeof window !== 'undefined' && typeof window.buildAdminEmailDraft === 'function')
        ? window.buildAdminEmailDraft(customerName)
        : null;

    document.getElementById('emailTo').value = customerEmail;
    document.getElementById('emailCustomerName').value = customerName;
    document.getElementById('emailSubject').value = draft?.subject || translate('Order Update - EzFix');
    document.getElementById('emailMessage').value = draft?.message || `${translate('Hi')} ${customerName},\n\n${translate('We wanted to follow up on your order.')}\n\n${translate('Best regards,')}\n${translate('EzFix Team')}`;
    document.getElementById('emailFormMessage').textContent = '';
    
    // Show the modal
    showEmailModal();
}

/**
 * Show email modal
 */
function showEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

/**
 * Close email modal
 */
function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    // Reset form
    document.getElementById('emailForm').reset();
    window.currentEmailOrderId = null;
    window.currentCustomerEmail = null;
}

/**
 * Handle email form submission
 */
async function handleEmailFormSubmit(e) {
    e.preventDefault();

    const translate = (typeof window !== 'undefined' && typeof window.t === 'function')
        ? window.t
        : (text) => text;
    
    const orderId = window.currentEmailOrderId;
    const customerEmail = window.currentCustomerEmail;
    const subject = document.getElementById('emailSubject').value;
    const message = document.getElementById('emailMessage').value;
    const messageDiv = document.getElementById('emailFormMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = translate('Sending...');
        messageDiv.textContent = '';
        messageDiv.className = 'form-message';

        const API_BASE_URL = '/api';
        
        function getAuthHeader() {
            const token = localStorage.getItem('token');
            if (!token) return {};
            return { 'Authorization': `Bearer ${token}` };
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({
                orderId,
                customerEmail,
                subject,
                message
            })
        };

        const response = await fetch(`${API_BASE_URL}/email/send-custom`, options);
        const result = await response.json();

        if (result.success) {
            messageDiv.textContent = `${translate('Email sent successfully to ')}${customerEmail}`;
            messageDiv.className = 'form-message success';
            setTimeout(() => {
                closeEmailModal();
                if (typeof window.renderAdminOrders === 'function') {
                    window.renderAdminOrders();
                }
            }, 1500);
        } else {
            messageDiv.textContent = translate('Failed to send email: ') + result.message;
            messageDiv.className = 'form-message error';
        }
    } catch (error) {
        messageDiv.textContent = translate('Error: ') + error.message;
        messageDiv.className = 'form-message error';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

/**
 * Send order status email
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 */
async function sendOrderStatusEmail(orderId, status) {
    try {
        const API_BASE_URL = '/api';
        
        function getAuthHeader() {
            const token = localStorage.getItem('token');
            if (!token) return {};
            return { 'Authorization': `Bearer ${token}` };
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            },
            body: JSON.stringify({
                orderId,
                status
            })
        };

        const response = await fetch(`${API_BASE_URL}/email/send-order-status`, options);
        const result = await response.json();

        if (result.success) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to send status email:', error);
        return false;
    }
}

