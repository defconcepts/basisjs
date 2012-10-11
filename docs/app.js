
  basis.require('basis.timer');
  basis.require('basis.event');
  basis.require('basis.ua');
  basis.require('basis.ua.visibility');
  basis.require('basis.dom');
  basis.require('basis.dom.event');
  basis.require('basis.dom.wrapper');
  basis.require('basis.cssom');
  basis.require('basis.template');
  basis.require('basis.html');
  basis.require('basis.date');
  basis.require('basis.dragdrop');
  basis.require('basis.animation');
  basis.require('basis.xml');
  basis.require('basis.layout');
  basis.require('basis.crypt');
  basis.require('basis.data');
  basis.require('basis.data.dataset');
  basis.require('basis.data.generator');
  basis.require('basis.data.property');
  basis.require('basis.data.index');
  basis.require('basis.entity');
  basis.require('basis.session');
  basis.require('basis.net.ajax');
  basis.require('basis.net.soap');
  basis.require('basis.ui');
  basis.require('basis.ui.button');
  basis.require('basis.ui.label');
  basis.require('basis.ui.tree');
  basis.require('basis.ui.popup');
  basis.require('basis.ui.menu');
  basis.require('basis.ui.table');
  basis.require('basis.ui.scrolltable');
  basis.require('basis.ui.window');
  basis.require('basis.ui.tabs');
  basis.require('basis.ui.calendar');
  basis.require('basis.ui.form');
  basis.require('basis.ui.scroller');
  basis.require('basis.ui.slider');
  basis.require('basis.ui.resizer');
  basis.require('basis.ui.paginator');
  basis.require('basis.ui.pageslider');
  basis.require('basis.ui.canvas');
  basis.require('basis.ui.graph');
  basis.require('basis.format.highlight');

  // app
  basis.ready(function(){
    basis.resource('app/layout.js')();
  });