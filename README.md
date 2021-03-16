# scrap-data-przepisownia

System, który w oparciu o technikę Data Scraping pobiera dane plików HTML przepisów kulinarnych ze strony www.przepisownia.pl. Dane te są filtrowane oraz przetwarzane w celu tworzenia nowych elementów do bazy danych.
Tworzone są produkty, przy czym każdy z nich ma przypisane wartości odżywcze. Informacje te są pobierane z Nutritionix API. Wykorzystane do tego jest również Google Translate API. 
Następnie na podstawie składników danego przepisu wyliczane są jego wartości odżywcze, a sam przepis finalnie dodawany jest do bazy. System umożliwia automatyczne porzeszanie się 
bazy danych o kolejne produkty, czy przepisy. Jest częścią napisanej przeze mnie pracy inżynierskiej.

#### wykorzystane technologie:

* Javascript
* mongoDB, mongoose
* cheerio
* google-translate-api
