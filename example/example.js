// пример работы плагина, реализовано на spb.av.ru

$(document).ready(function(){
  
    var ajaxSearchView = (function(){
      
      this.cart = Site.cartProducts;
      
      this.selectors = {
        searchInput: '.search-popup__input',
        searchInputClear: '.search-popup__input-delete',
        resultWrap: '.search-popup__results',
        productsWrap: '.search-popup-products',
        memoryWrap: '.search-popup__memory',
        memoryList: '.search-popup__memory-list',
        memoryClear: '.search-popup__memory-clear',
        productList: '.search-popup-products__list',
        productsAll: '.search-popup-products__all',
        productBlock: '.search-popup-products__items',
        productBtn: '.search-popup-products__btn',
        productTitle: '.search-popup-products__title',
        searchPreloader: '.search-popup__preload',
        searchPopup: '.search-popup',
        headerInput: '.main-menu__search-wrap',
        headerSearch: '.main-menu__search',
        searchPopupClose: '.search-popup__close'
      }
      
      this.templates = {
        listItem: function(q){
          var html = '';
          
          html = '<li><a href="/search?q=' + q + '">' + q + '</a></li>';
          
          return html;
        },
        
        productItem: function( item ){
          var html = '',
              self = this,
              quantityBlock = '',
              unit = '',
              prodPrice, decimalPrice;
          
          if(item.unit === 'pce') {
            quantityBlock = '<div class="quantity center search-popup-quantity" data-unit="1" data-price="' + item.variants[0].price + '"><a href="#0" class="minus"></a><input class="normal" readonly="readonly" name="quantity" size="4" value="1" type="text"><span class="quantity-unit">шт</span><a href="#0" class="plus"></a></div>';
            unit = 'шт.';
          } else {
            quantityBlock = '<div class="quantity search-popup-quantity" data-unit="100" data-price="' + item.variants[0].price + '"><a href="#0" class="minus"></a><input class="kilo" readonly="readonly" size="2" value="0" type="text"><span class="quantity-unit">кг</span><input class="gramm" readonly="readonly" size="3" value="100" type="text"><span class="quantity-unit">г</span><a href="#0" class="plus"></a><input name="quantity" value="0.1" type="hidden"></div>';
            unit = 'кг.';
          }
          
          if ((+item.variants[0].price ^ 0) !== +item.variants[0].price){
              decimalPrice = self._getDecimal( +item.variants[0].price ).toFixed( 2 ) * 100;
          } else {
              decimalPrice = '00';
          }
          
          prodPrice = Math.floor( item.variants[0].price );
          
          html = '<div class="search-popup-item">\
                    <form action="/cart_items" method="post" data-product-unit="шт" data-product-price="' + item.variants[0].price + '">\
                      <div class="search-popup-item__img"><a href="' + item.url + '"><img src="' + item.first_image.compact_url + '" alt=""/></a></div>\
                      <div class="search-popup-item__title"><a href="' + item.url + '">' + item.title + '</a></div>\
                      ' + quantityBlock + '\
                      <div class="search-popup-item__price">\
                        <div class="search-popup-item__total-summ">\
                          <b>' +  prodPrice + '</b><sup>' + decimalPrice + '</sup><span class="currency">руб</span>\
                        </div>\
                        <div class="search-popup-item__item-summ">\
                          <b>' +  prodPrice + '</b><sup>' + decimalPrice + '</sup><span class="currency">руб</span><span class="currency"> за 1 ' + unit + '</span>\
                        </div>\
                      </div>\
                      <div class="search-popup-item__buy">\
                        <button class="buy buy-button button"><span>В корзину</span></button>\
                      </div>\
                      <input name="product_id" value="' + item.id + '" type="hidden">\
                      <input name="variant_id" value="' + item.variants[0].id + '" type="hidden">\
                      </form>\
                  </div>';
          
          return html;
        },
        
        bigButton: function( count, q ){
          var html = '',
              text = '';
          
          if ( count == 0 ) {
            text = 'Товаров не найдено';
          } else {
            text = 'Все ' + count + ' товаров';
          }
          
          html = '<a href="/search?q=' + q + '" class="button" ><span>' + text + '</span></a>';
          
          return html;
        },
        
        itemPrice: function( price, decimal ){
            var html = '';
          
          html = '<b>' +  price + '</b><sup>' + decimal + '</sup><span class="currency">руб</span>';
          
          return html;
        }
      }
      
      this.defaultOptions = {
        maxProductsLength: 3
      };
      
      $.extend(this, {
        init: function(){
          var self = this,
              selectors = self.selectors;
          
          $(selectors.searchInput).on('nkAjaxSearch:init nkAjaxSearch:memory:update', function(e, lastSearch){ self._showMemory(lastSearch); });
          $(selectors.searchInput).on('nkAjaxSearch:results:complete', function(e, data, q){ self._hidePreloader(); self._showResults(data, q); });
          $(selectors.searchInput).on('nkAjaxSearch:results:start', function(){ self._addPreloader(); });
          $(selectors.searchInput).on('keyup', function(){ if ($(this).val().length === 0) self._clearSearchInput(); });
          
          $(selectors.memoryClear).on('click', function(){ self._clearMemory(); });
          $(selectors.searchInputClear).on('click', function(){ self._clearSearchInput(); });
          $(selectors.headerInput).on('click', function(){ self._openPopup(); });
          $(selectors.searchPopupClose).on('click', function(){ self._closePopup(); });
          $(selectors.productBlock).on('click', '.minus, .plus', function(){ setTimeout(function(){self._recalculateProducts()}, 50); });
          $(document).mouseup(function (e) { self._hidePopupOnClickBody(e) });
          
          $(selectors.searchInput).nkAjaxSearch();
        },
        
        _showMemory: function( memoryArr ){
          var self = this,
              template = self.templates.listItem,
              $prodBlock = $(self.selectors.productsWrap),
              $memoryBlock = $(self.selectors.memoryWrap),
              $memoryList = $(self.selectors.memoryList);
          
          $memoryList.html('');
          
          if(memoryArr.length === 0) {
            $memoryBlock.hide();
            $prodBlock.hide();
            return false;
          }
          
          $prodBlock.hide();
          $memoryBlock.show();
          
          for(var i = 0; i < memoryArr.length; i++) {
            $memoryList.append(template(memoryArr[i]));
          }
        },
        
        _showResults: function( data, query ){
            var self = this,
              $prodBlock = $(self.selectors.productsWrap),
              $memoryBlock = $(self.selectors.memoryWrap),
              $productBtn = $(self.selectors.productBtn),
              $productTitle = $(self.selectors.productTitle),
              buttonTemplate = self.templates.bigButton;
          
          $memoryBlock.hide();
          $prodBlock.show();
          
          self._createSearchList(data.products, query);
          self._createProductList(data.products);
          
          $productBtn.html('');
          $productBtn.append(buttonTemplate(data.count, query));
          
          if (data.count === 0) {
            $productTitle.hide();
          } else {
            $productTitle.show();
          }
          
          self._recalculateProducts();
        },
        
        _createSearchList: function( products, query ){
          var self = this,
              $prodList = $(self.selectors.productList),
              $prodAll = $(self.selectors.productsAll),
              templateList = self.templates.listItem;
          
          $prodList.html('');
          
          $prodList.append(templateList(query));
          
          $.each(products, function(){
            $prodList.append(templateList(this.title))
          });
          
          $prodAll.html('<a href="/search?q=' + query + '">Все результаты</a>');
        },
        
        _createProductList: function( products ){
          var self = this,
              template = self.templates.productItem,
              $prodBlock = $(self.selectors.productBlock);
          
          if (products.length > self.defaultOptions.maxProductsLength) products.length = self.defaultOptions.maxProductsLength;
          
          $prodBlock.html('');
          
          $.each(products, function(){
            $prodBlock.append(template(this));
          });
        },
        
        _clearMemory: function(){
          var self = this,
              $memoryList = $(self.selectors.memoryList),
              $memoryBlock = $(self.selectors.memoryWrap),
              $input = $(self.selectors.searchInput);
          
          $input.nkAjaxSearch('memoryClear');
          $memoryBlock.hide();
          $memoryList.html('');
        },
        
        _clearSearchInput: function(){
          var self = this,
              $input = $(self.selectors.searchInput);
        
          $input.val('');
          $input.nkAjaxSearch('memoryUpdate');
        },
        
        _getDecimal: function( num ) {
          return num > 0 ? num - Math.floor( num ) : Math.ceil( num ) - num;
        },
        
        _addPreloader: function(){
          var self = this,
              $searchPreloader = $(self.selectors.searchPreloader),
              $memoryBlock = $(self.selectors.memoryWrap),
              $prodBlock = $(self.selectors.productsWrap);
          
          $prodBlock.hide();
          $memoryBlock.hide();
          $searchPreloader.show();
        },
        
        _hidePreloader: function(){
          var self = this,
              $searchPreloader = $(self.selectors.searchPreloader);
          
          $searchPreloader.hide();
        },
        
        _openPopup: function(){
            var self = this,
              $popup = $(self.selectors.searchPopup),
              $input = $(self.selectors.searchInput);
          
          $popup.show();
          $input.focus();
        },
        
        _closePopup: function(){
            var self = this,
              $popup = $(self.selectors.searchPopup);
          
          $popup.hide();
        },
        
        _recalculateProducts: function(){
          var self = this,
              template = self.templates.itemPrice;
          
          $('.search-popup-products__items').find('.search-popup-item').each(function(){
            
            var itemPrice = $(this).find('form').data('product-price'),
                val = $(this).find('[name="quantity"]').val(),
                price, decimalPrice, prodPrice;
            
            price = itemPrice * val;
            
            if ((+price ^ 0) !== +price){
                decimalPrice = self._getDecimal( +price ).toFixed( 2 ) * 100;
            } else {
                decimalPrice = '00';
            }
  
            prodPrice = Math.floor( price );
            $(this).find('.search-popup-item__total-summ').html(template(prodPrice, decimalPrice));
          });
        },
        
        _hidePopupOnClickBody: function(e){
          var self = this,
              $container = $(self.selectors.headerSearch);
          
          if ($container.has(e.target).length === 0){
            self._closePopup();
          }
        }
      });
      
      return this.init();
    })();
    
  });