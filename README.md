# nkAjaxSearch

Плагин для ajax поиска на платформе InSales.
Поиск ведется в общей коллекции (должна называться по умолчанию (all), позже сделаю возможность менять через настройки название), в настроках главной категории должна стоять галка "содержит продукты с внутренних категорий"

## Параметры 
inlineLength - количество букв, после которых сработает скрипт, по умолчанию 3;
maxProductCount - количество подгружаемых результатов, по умолчанию 5;
maxMemoryFieldsCount - количество сохраняемых результатов поиска в localStorage

## События
nkAjaxSearch:init - вызывается после запуска плагина, возвращает первым аргументом последнюю поисковую фразу;
nkAjaxSearch:results:complete - вызывается после получения json-а с результатами поиска, возвращает первым аргументом обьект поиска;
nkAjaxSearch:results:start - вызывается перед отправкой данных для поиска на сервер (может использоваться для прелоадера);
nkAjaxSearch:memory:update - вызывается после апдейта истории поиска, возвращает массив поисков;

## Методы
memoryClear - удаляет историю поисков;
memoryUpdate - обновляет историю поисков, вызывает событие nkAjaxSearch:memory:update;
