/*  Параметры 
  	inlineLength - количество букв, после которых сработает скрипт, по умолчанию 3;
    maxProductCount - количество подгружаемых результатов, по умолчанию 5;
    maxMemoryFieldsCount - количество сохраняемых результатов поиска в localStorage
    
    События
    nkAjaxSearch:init - вызывается после запуска плагина, возвращает первым аргументом последнюю поисковую фразу;
    nkAjaxSearch:results:complete - вызывается после получения json-а с результатами поиска, возвращает первым аргументом обьект поиска;
    nkAjaxSearch:results:start - вызывается перед отправкой данных для поиска на сервер (может использоваться для прелоадера);
    nkAjaxSearch:memory:update - вызывается после апдейта истории поиска, возвращает массив поисков;
    
    Методы
    memoryClear - удаляет историю поисков;
    memoryUpdate - обновляет историю поисков, вызывает событие nkAjaxSearch:memory:update;
*/


((function ( $ ) {
  'use strict';
  
  var NkAjaxSearch = function(el, options){
    var self = this;
    
    self.el = $(el);
    self.options = $.extend({}, NkAjaxSearch.defaults, options);
    self.keyupTimeoutID = '';
    
    self.init();
    self.setOptions(options);
  };
  
  NkAjaxSearch.defaults = {
    inlineLength: 3,
    maxProductCount: 5,
    maxMemoryFieldsCount: 3,
    
  };
  
  NkAjaxSearch.prototype = {
    init: function(){
      var self = this,
          options = self.options;
      
  	  self.el.on('keyup', function(){ 
        var item = this;
        
        if(self.keyupTimeoutID !== '') clearTimeout( self.keyupTimeoutID );
        
        self.keyupTimeoutID = setTimeout( function(){
          self._fieldHandler(item, options.inlineLength);
        }, 300);
      });
      
      self.el.trigger('nkAjaxSearch:init', [self.getLastSearchMemory()]);
    },
    
    setOptions: function(suppliedOptions){
      var self = this,
          options = $.extend({}, self.options, suppliedOptions);
    },
    
    
    getLastSearchMemory: function(){
      var item = localStorage.getItem('nkAjaxSearchArr')
      
      if (item !== null){
        return $.parseJSON(item);
      } else {
        return []
      }
    },
    
    _fieldHandler: function(el, length){
      var self = this,
          val = $(el).val();
      
      if (val.length <= length) return false;
      
      self._getSearchResult(val);
    },
    
    _getSearchResult: function(val){
      var self = this,
      	  options = self.options,
      	  path = '/collection/all.json',
          data = {};
      
      data.q = val;
      data.page_size = options.maxProductCount;
      data.page = 1;
      
      self.el.trigger('nkAjaxSearch:results:start');
      
      $.ajax({
        dataType: "json",
        url: path,
        data: data,
        success: function(response){
          self._getSearchResultCallback(response, val);
        },
        error: function(response){
          console.log('error: ' + response.statusText);
        }
      });
    },
    
    _getSearchResultCallback: function(data, q){
      var self = this,
          options = self.options,
      	  memoryArr = self.getLastSearchMemory(),
          memoryString = '';
      
      memoryArr.unshift(q)
      
      if(memoryArr.length > options.maxMemoryFieldsCount) {
        memoryArr.length = options.maxMemoryFieldsCount;
      }
		
      memoryString = JSON.stringify(memoryArr);
  	  localStorage.setItem('nkAjaxSearchArr', memoryString );
      
      self.el.trigger('nkAjaxSearch:results:complete', [data, q]);
    },
    
    memoryClear: function(){
      localStorage.removeItem('nkAjaxSearchArr');
    },
    
    memoryUpdate: function(){
      var self = this,
          memoryArr = self.getLastSearchMemory();

      self.el.trigger('nkAjaxSearch:memory:update', [memoryArr])
    }
  };

  
  $.fn.nkAjaxSearch = function(opt, args) {
    var dataKey = 'nkAjaxSearch';
    
    this.each(function() {
      var inputElement = $(this),
          instance = inputElement.data(dataKey);

      if (typeof opt === 'string') {
      	if (instance && typeof instance[opt] === 'function') {
          instance[opt](args);
        }
      } else {
        if (instance && instance.dispose) {
          instance.dispose();
        }
        instance = new NkAjaxSearch(this, opt);
        inputElement.data(dataKey, instance);
      }
    });

    return this;
  };
  
})(jQuery));