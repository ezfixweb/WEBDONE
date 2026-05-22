# EzFix Mobile Android App

Tento adresář obsahuje základní Android aplikaci pro načítání mobilní skladové stránky v `WebView`.

## Build

1. Otevři `android-app` v Android Studiu.
2. Sync Gradle.
3. Spusť modul `app` na zařízení nebo emulátoru.

Alternativně můžeš použít generated Gradle wrapper:

```bash
cd android-app
./gradlew assembleDebug
```

Pokud `./gradlew` hlásí chybu o SDK, přidej soubor `android-app/local.properties` s cestou ke své Android SDK, například:

```properties
sdk.dir=/cesta/k/android-sdk
```

## Použití

- Zadej adresu svého backend serveru, například `http://192.168.0.100:3000`.
- Klepni na `Otevřít sklad`.
- Aplikace načte `mobile-inventory.html` z tvého serveru.

## Poznámky

- Aplikace vyžaduje přístup k internetu.
- Mobilní UI a synchronizace používají stávající webový backend.
