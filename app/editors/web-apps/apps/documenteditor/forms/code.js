/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  TextareaField.js
 *
 *  Created on 29/09/20
 *
 */

if (Common === undefined)
    var Common = {};

define('common/main/lib/component/TextareaField',[], function () { 'use strict';
    Common.UI.TextareaField = Common.UI.BaseView.extend((function() {
        return {
            options : {
                id          : null,
                cls         : '',
                style       : '',
                value       : '',
                maxlength   : undefined,
                placeHolder : '',
                spellcheck  : false,
                disabled: false,
                resize: false,
                rows: 2
            },

            template: _.template([
                '<div class="textarea-field" style="<%= style %>">',
                    '<textarea ',
                    'rows="<%= rows %>" ',
                    'spellcheck="<%= spellcheck %>" ',
                    'class="form-control <%= cls %>" ',
                    'placeholder="<%= placeHolder %>" ',
                    '<% if (dataHint) {%>',
                    'data-hint="<%= dataHint %>" ',
                    '<% } %>',
                    '<% if (dataHintDirection) {%>',
                    'data-hint-direction="<%= dataHintDirection %>" ',
                    '<% } %>',
                    '<% if (dataHintOffset) {%>',
                    'data-hint-offset="<%= dataHintOffset %>" ',
                    '<% } %>',
                    '></textarea>',
                '</div>'
            ].join('')),

            initialize : function(options) {
                Common.UI.BaseView.prototype.initialize.call(this, options);

                var me = this;

                this.id             = me.options.id || Common.UI.getId();
                this.cls            = me.options.cls;
                this.style          = me.options.style;
                this.value          = me.options.value;
                this.placeHolder    = me.options.placeHolder;
                this.template       = me.options.template || me.template;
                this.disabled       = me.options.disabled;
                this.spellcheck     = me.options.spellcheck;
                this.maxLength      = me.options.maxLength;
                this.rows           = me.options.rows;

                me.rendered         = me.options.rendered || false;

                if (me.options.el) {
                    me.render();
                }
            },

            render : function(parentEl) {
                var me = this;

                if (!me.rendered) {
                    this.cmpEl = $(this.template({
                        id          : this.id,
                        cls         : this.cls,
                        style       : this.style,
                        placeHolder : this.placeHolder,
                        spellcheck  : this.spellcheck,
                        rows        : this.rows,
                        dataHint    : this.options.dataHint,
                        dataHintDirection: this.options.dataHintDirection,
                        dataHintOffset: this.options.dataHintOffset,
                        scope       : me
                    }));

                    if (parentEl) {
                        this.setElement(parentEl, false);
                        parentEl.html(this.cmpEl);
                    } else {
                        this.$el.html(this.cmpEl);
                    }
                } else {
                    this.cmpEl = this.$el;
                }

                if (!me.rendered) {
                    var el = this.cmpEl;

                    this._input = this.cmpEl.find('textarea').addBack().filter('textarea');
                    this._input.on('blur',   _.bind(this.onInputChanged, this));
                    this._input.on('keydown',    _.bind(this.onKeyDown, this));
                    if (this.maxLength) this._input.attr('maxlength', this.maxLength);
                    if (!this.resize) this._input.css('resize', 'none');

                    if (this.disabled)
                        this.setDisabled(this.disabled);
                }

                me.rendered = true;

                if (me.value)
                    me.setValue(me.value);

                return this;
            },

            _doChange: function(e, extra) {
                // skip processing for internally-generated synthetic event
                // to avoid double processing
                if (extra && extra.synthetic)
                    return;

                var newValue = $(e.target).val(),
                    oldValue = this.value;

                this.trigger('changed:before', this, newValue, oldValue, e);

                if (e.isDefaultPrevented())
                    return;

                this.value = newValue;

                // trigger changed event
                this.trigger('changed:after', this, newValue, oldValue, e);
            },

            onInputChanged: function(e, extra) {
                this._doChange(e, extra);
            },

            onKeyDown: function(e) {
                this.trigger('keydown:before', this, e);

                if (e.isDefaultPrevented())
                    return;

                if (e.keyCode === Common.UI.Keys.RETURN) {
                    e.stopPropagation();
                }
                if (e.keyCode == Common.UI.Keys.ESC)
                    this.setValue(this.value);
                if (e.keyCode==Common.UI.Keys.ESC)
                    this.trigger('inputleave', this);
            },

            setDisabled: function(disabled) {
                disabled = !!disabled;
                this.disabled = disabled;
                $(this.el).toggleClass('disabled', disabled);
                disabled
                    ? this._input.attr('disabled', true)
                    : this._input.removeAttr('disabled');
            },

            isDisabled: function() {
                return this.disabled;
            },

            setValue: function(value) {
                this.value = value;

                if (this.rendered){
                    this._input.val(value);
                }
            },

            getValue: function() {
                return this.value;
            },

            focus: function() {
                this._input.focus();
            }
        }
    })());
});

/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Date: 17.05.16
 */

if (Common === undefined)
    var Common = {};

Common.Views = Common.Views || {};

define('common/main/lib/view/PluginDlg',[], function () {
    'use strict';

    Common.Views.PluginDlg = Common.UI.Window.extend(_.extend({
        initialize : function(options) {
            var _options = {};
            _.extend(_options,  {
                header: true,
                enableKeyEvents: false,
                automove: false
            }, options);

            this.bordersOffset = 40;
            _options.width = (Common.Utils.innerWidth()-this.bordersOffset*2-_options.width)<0 ? Common.Utils.innerWidth()-this.bordersOffset*2: _options.width;
            _options.cls += ' advanced-settings-dlg invisible-borders plugin-dialog';
            (!_options.buttons || _.size(_options.buttons)<1) && (_options.cls += ' no-footer');
            _options.contentHeight = _options.height;
            _options.height = 'auto';

            this.templateHeader = [
                '<div class="header">',
                    '<div class="side-block left">',
                        '<div class="tools left"></div>',
                        '<div class="custom-controls left"></div>',
                    '</div>',
                    '<div class="title">',
                        '<label></label>',
                        '<div class="custom-title"></div>',
                    '</div>',
                    '<div class="side-block right">',
                        '<div class="custom-controls right"></div>',
                        '<div class="tools right">',
                            '<div class="more drag-ignore"></div>',
                            '<div>',
                                '<div class="plugin-dock drag-ignore tool custom toolbar__icon btn-pin"></div>',
                            '</div>',
                            '<div class="tool close"></div>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join('');

            this.template = [
                '<div id="id-plugin-container" class="box" style="height:' + _options.contentHeight + 'px;">',
                '<div id="id-plugin-placeholder" style="width: 100%;height: 100%;"></div>',
                '</div>',
                '<% if ((typeof buttons !== "undefined") && _.size(buttons) > 0) { %>',
                '<div class="separator horizontal"></div>',
                '<% } %>'
            ].join('');

            _options.tplHeader = _.template(this.templateHeader)(_options);
            _options.tpl = _.template(this.template)(_options);

            this.url = options.url || '';
            this.loader = (options.loader!==undefined) ? options.loader : true;
            this.frameId = options.frameId || 'plugin_iframe';
            this.guid = options.guid;
            this.customControls = [];
            Common.UI.Window.prototype.initialize.call(this, _options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var bodyEl = this.$window.find('> .body');
            bodyEl.css({height: 'auto', overflow: 'hidden'});
            this.boxEl = this.$window.find('.body > .box');

            /**
             * @type {Array<'close' | 'docked' | 'collapse'>}
             */
            let hiddenHeaderButtons = this.options.hiddenHeaderButtons;
            !Array.isArray(hiddenHeaderButtons) && (hiddenHeaderButtons = []);

            this._headerFooterHeight = this.options.header ? parseInt(this.$window.find('.header').css('height')) : 0;
            if (this.options.buttons && _.size(this.options.buttons)>0)
                this._headerFooterHeight += parseInt(this.$window.find('.footer').css('height')) + parseInt(bodyEl.css('padding-top')) + parseInt(bodyEl.css('padding-bottom'));
            this._headerFooterHeight += ((parseInt(this.$window.css('border-top-width')) + parseInt(this.$window.css('border-bottom-width'))));

            if (Common.Utils.innerHeight()-this.bordersOffset*2 < this.options.contentHeight + this._headerFooterHeight) {
                this._restoreHeight = this.options.contentHeight + this._headerFooterHeight;
                this.options.contentHeight = Common.Utils.innerHeight()-this.bordersOffset*2 - this._headerFooterHeight;
                this.boxEl.css('height', this.options.contentHeight);
            }

            if(hiddenHeaderButtons.includes('close')) {
                this.$window.find('.header .close').remove();
            }

            this.btnMore = new Common.UI.Button({
                parentEl: this.$window.find('.more'),
                cls: 'btn-toolbar no-focus',
                iconCls: 'toolbar__icon btn-more',
                hint: this.textMore,
                enableToggle: true
            });
            this.btnMore.hide();
            this.btnMore.on('toggle', function(btn, state, e) {
                (state) ? me.onMoreShow() : me.onMoreHide();
            });
            const moreContainer = $('<div class="dropdown-menu more-container"><div class="inner"></div></div>');
            this.$window.find('.more').append(moreContainer);
            this.btnMore.$panel = moreContainer.find('.inner'); 

            var iframe = document.createElement("iframe");
            iframe.id           = this.frameId;
            iframe.name         = 'pluginFrameEditor';
            iframe.width        = '100%';
            iframe.height       = '100%';
            iframe.align        = "top";
            iframe.frameBorder  = 0;
            iframe.scrolling    = "no";
            iframe.allow = "camera; microphone; display-capture";
            iframe.onload       = _.bind(this._onLoad,this);

            var me = this;
            var pholder = this.$window.find('#id-plugin-placeholder');
            if (this.loader) {
                setTimeout(function(){
                    if (me.isLoaded) return;
                    me.loadMask = new Common.UI.LoadMask({owner: pholder});
                    me.loadMask.setTitle(me.textLoading);
                    me.loadMask.show();
                    if (me.isLoaded) me.loadMask.hide();
                }, 500);
            }

            iframe.src = this.url;
            pholder.append(iframe);
            this.frame = iframe;
            this.on('resizing', function(args){
                me.boxEl.css('height', parseInt(me.$window.css('height')) - me._headerFooterHeight);
            });

            var onMainWindowResize = function(){
                me.onWindowResize();
                me.onMoreHide();
            };
            $(window).on('resize', onMainWindowResize);
            this.on('close', function() {
                $(window).off('resize', onMainWindowResize);
            });

            this.on('resizing', function() {
                me.updateMoreMenu();
                me.onMoreHide();
            });

            this.on('drag', function() {
                me.onMoreHide();
            });

            if(this.options.isCanDocked && !hiddenHeaderButtons.includes('docked')) {
                this.showDockedButton();
            } else {
                this.$window.find('.plugin-dock').parent().remove();
            }

            this.updateTitle();
        },

        addHeaderCustomControls: function(added, removed) {
            const me = this;
            let beenСhanges = false;

            if(Array.isArray(removed) && removed.length) {
                removed.forEach(function(cmp, index) {
                    const controlIndex = _.findIndex(me.customControls, {cmp: cmp});
                    if (controlIndex != -1) {
                        const customControl = me.customControls[controlIndex];
                        customControl.$elRef.remove();
                        customControl.$slot.remove();
                        me.customControls.splice(controlIndex, 1);
                    }
                });
                beenСhanges = true;
            }

            if(Array.isArray(added) && added.length) {
                added.forEach(function(cmp) {
                    let $parent; 
                    if(cmp.options.isTitle) {
                        $parent = $('.header .custom-title', me.$window);
                    }
                    else if(cmp.options.align == 'left') $parent = $('.side-block.left .custom-controls', me.$window);
                    else if(cmp.options.align == 'right') $parent = $('.side-block.right .custom-controls', me.$window);
        
                    if($parent) {
                        const $slot = $('<div class="drag-ignore"></div>');
                        $slot.append(cmp.$el);
                        $parent.append($slot);
                        me.customControls.push({
                            $slot: $slot,
                            cmp: cmp,
                            $elRef: $slot.children().first(), 
                            align: cmp.options.align,
                            isTitle: !!cmp.options.isTitle
                        });
                    }     
                    if(cmp.menu) {
                        cmp.menu.on('show:after', function(menu, e) {
                            // Hide the "More" menu if another menu outside of it is being opened.
                            if(menu.el == e.target && !$.contains(me.btnMore.$panel[0], menu.el)) {
                                me.onMoreHide();
                            }
                        });
                    }
                });
                beenСhanges = true;
            }

            if(beenСhanges) {
                // Sort by opacity priority: right align buttons are hidden first
                me.customControls.sort(function(a, b) {
                    const order = function(item) {
                        if (item.isTitle) return 0;
                        else if (item.align === 'left') return 1;
                        return 2; // right
                    };
                    return order(a) - order(b);
                });
                me.customControls.reverse();
    
            }
            me.updateTitle();
            me.updateMoreMenu();
        },

        updateTitleMaxWidth: function() {
            const $header = this.$window.find('.header');
            const $title = $header.find('.title');
            const $tools = $header.find('.tools');
            const titleMargins = (parseFloat($title.css('margin-left')) || 0) + (parseFloat($title.css('margin-right')) || 0);
            const toolsWidths = $tools.map(function() {
                return $(this).outerWidth(true);
            }).get();

            var maxToolsWidth = Math.max.apply(Math, toolsWidths);
            $title.css('max-width', $header.width() - (maxToolsWidth * 2) - titleMargins + 'px');
        },

        updateTitle: function() {
            if(this.customControls.some(function(el) { return el.isTitle })) {
                this.$window.find('.header label').hide();
                this.$window.find('.header .custom-plugin').show();
            } else {
                const label = (this.header && this.header.title) || this.options.title;
                this.$window.find('.header label').text(label).show();
                this.$window.find('.header .custom-plugin').hide();
            }
            this.updateTitleMaxWidth();
        },

        updateMoreMenu: function() {
            if (!this.customControls || this.customControls.length == 0) {
                this.btnMore.hide();
                return;
            }

            const me = this;
            const $header = this.$window.find('.header');
            let showMore = false;

            // Put all the components back into their slots and display them.
            if (Array.isArray(this.customControls)) {
                this.customControls.forEach(function(item) {
                    item.$slot.show();
                    if (item.$elRef && item.$elRef.length && !$.contains(item.$slot[0], item.$elRef[0])) {
                        item.$slot.append(item.$elRef);
                    }
                });
            }
            this.btnMore.hide();

            // Calculate the total width of all direct children of the header.
            // If it exceeds the width of the header, there is an overflow.
            const isOverflowing = function($parent) {
                let fullWidth = 0;
                $parent.children().each(function() {
                    fullWidth += $(this).outerWidth(true);
                });
                return fullWidth - $parent.width() > 0.1;
            };

            me.btnMore.show();
            const groupedControls = _.groupBy(me.customControls, 'align');
            ['right', 'left'].forEach(function(align) {
                const $sideBlock = $header.find('.side-block' + '.' + align);
                if(groupedControls[align] && $sideBlock && isOverflowing($sideBlock)) {
                    showMore = true;
                    for (let i = 0; i < groupedControls[align].length; i++) {
                        const item = groupedControls[align][i];
                        if(item.isTitle) continue;
                        if (!isOverflowing($sideBlock)) break;

                        if (item.$elRef && item.$elRef.length) {
                            item.$slot.hide();
                            me.btnMore.$panel.prepend(item.$elRef);
                        }
                    }
                }
            });
            me.btnMore[showMore ? 'show' : 'hide']();

            this.updateTitleMaxWidth();
        },

        _onLoad: function() {
            this.isLoaded = true;
            if (this.loadMask)
                this.loadMask.hide();
        },

        setInnerSize: function(width, height) {
            var maxHeight = Common.Utils.innerHeight(),
                maxWidth = Common.Utils.innerWidth(),
                borders_width = (parseInt(this.$window.css('border-left-width')) + parseInt(this.$window.css('border-right-width'))),
                bordersOffset = this.bordersOffset*2;
            if (maxHeight - bordersOffset<height + this._headerFooterHeight)
                height = maxHeight - bordersOffset - this._headerFooterHeight;
            if (maxWidth - bordersOffset<width + borders_width)
                width = maxWidth - bordersOffset - borders_width;

            this.boxEl.css('height', height);

            let offset_x = (width - this.getWidth())/2,
                offset_y = (height - this.getHeight() + this._headerFooterHeight)/2;

            Common.UI.Window.prototype.setHeight.call(this, height + this._headerFooterHeight);
            Common.UI.Window.prototype.setWidth.call(this, width + borders_width);

            const curr_left = this.getLeft(),
                curr_top = this.getTop();
            if (curr_left + width + borders_width > maxWidth)
                offset_x = Math.max(0, maxWidth - width - borders_width - this.bordersOffset);
            else if (curr_left - offset_x < 0)
                offset_x = 0;
            else offset_x = curr_left - offset_x;

            if (curr_top + height + this._headerFooterHeight > maxHeight)
                offset_y = Math.max(0, maxHeight - height - this._headerFooterHeight - this.bordersOffset);
            else if (curr_top - offset_y < Common.Utils.InternalSettings.get('window-inactive-area-top'))
                offset_y = Common.Utils.InternalSettings.get('window-inactive-area-top');
            else offset_y = curr_top - offset_y;

            this.$window.css({'left': offset_x, 'top': offset_y});
            this._restoreHeight = this._restoreWidth = undefined;
        },

        onMoreHide: function() {
            let moreContainer = this.btnMore.$panel.parent();
            if (this.btnMore.pressed) {
                this.btnMore.toggle(false, true);
            }
            if (moreContainer.is(':visible')) {
                moreContainer.hide();
            }
        },

        onMoreShow: function() {
            let moreContainer = this.btnMore.$panel.parent(),
                target = this.btnMore.$el,
                showxy = Common.Utils.getOffset(target),
                left = showxy.left,
                right = Common.Utils.innerWidth() - (showxy.left + target.width()),
                top = showxy.top + target.height() + 2;

            let styles = Common.UI.isRTL() ? 
                {left: left, right: 'auto', top : top, 'max-width': (Common.Utils.innerWidth() - left) + 'px'} : 
                {right: right, left: 'auto', top : top, 'max-width': (Common.Utils.innerWidth() - right) + 'px'};
            moreContainer.css(styles);
            moreContainer.show();
        },

        onWindowResize: function() {
            var main_width  = Common.Utils.innerWidth(),
                main_height = Common.Utils.innerHeight(),
                win_width = this.getWidth(),
                win_height = this.getHeight(),
                bordersOffset = (this.resizable) ? 0 : this.bordersOffset;
            if (win_height<main_height-bordersOffset*2+0.1 ) {
                if (!this.resizable && this._restoreHeight>0 && win_height < this._restoreHeight) {
                    var height = Math.max(Math.min(this._restoreHeight, main_height-bordersOffset*2), this.initConfig.minheight);
                    this.setHeight(height);
                    this.boxEl.css('height', height - this._headerFooterHeight);
                }
                var top = this.getTop();
                if (top<bordersOffset) this.$window.css('top', bordersOffset);
                else if (top+win_height>main_height-bordersOffset)
                    this.$window.css('top', main_height-bordersOffset - win_height);
            } else {
                if (this._restoreHeight===undefined) {
                    this._restoreHeight = win_height;
                }
                this.setHeight(Math.max(main_height-bordersOffset*2, this.initConfig.minheight));
                this.boxEl.css('height', Math.max(main_height-bordersOffset*2, this.initConfig.minheight) - this._headerFooterHeight);
                this.$window.css('top', bordersOffset);
            }
            if (win_width<main_width-bordersOffset*2+0.1) {
                if (!this.resizable && this._restoreWidth>0 && win_width < this._restoreWidth) {
                    this.setWidth(Math.max(Math.min(this._restoreWidth, main_width-bordersOffset*2), this.initConfig.minwidth));
                }
                var left = this.getLeft();
                if (left<bordersOffset) this.$window.css('left', bordersOffset);
                else if (left+win_width>main_width-bordersOffset)
                    this.$window.css('left', main_width-bordersOffset-win_width);
            } else {
                if (this._restoreWidth===undefined) {
                    this._restoreWidth = win_width;
                }
                this.setWidth(Math.max(main_width-bordersOffset*2, this.initConfig.minwidth));
                this.$window.css('left', bordersOffset);
            }
        },

        onThemeChanged: function() {
            this.updateMoreMenu();
            Common.UI.Window.prototype.onThemeChanged.call(this);
        },

        showDockedButton: function() {
            var header = this.$window.find('.header .tools:not(.left)'),
                // header = this.$window.find('.header .tools.left'),
                btn = header.find('.plugin-dock');
            if (!this._dockedTipInit) {
                btn.on('click', _.bind(function() {
                    var tip = btn.data('bs.tooltip');
                    if (tip) tip.dontShow = true;
                    this.fireEvent('docked', this.frameId);
                }, this));
                btn.tooltip({title: this.textDock, placement: 'cursor', zIndex: parseInt(this.$window.css('z-index')) + 10});
                this._dockedTipInit = true;
            }
            btn.show();
            header.removeClass('hidden');
        },

        showButton: function(id, toRight) {
            var header = this.$window.find(toRight ? '.header .tools:not(.left)' : '.header .tools.left'),
                btn = header.find('#id-plugindlg-' + id);
            if (btn.length<1) {
                var iconCls = (id ==='back') ? 'btn-promote' : 'btn-' + Common.Utils.String.htmlEncode(id);
                btn = $('<div id="id-plugindlg-' + id + '" class="tool custom toolbar__icon ' + iconCls + '"></div>');
                btn.on('click', _.bind(function() {
                    this.fireEvent('header:click',id);
                }, this));
                const more = header.find('.more');
                if (more.length > 0) {
                    btn.insertAfter(more);
                } else {
                    header.prepend(btn);
                }
            }
            btn.show();
            header.removeClass('hidden');
        },

        hideButton: function(id) {
            var btn = this.$window.find('.header #id-plugindlg-' + id);
            if (btn.length>0) {
                btn.hide();
            }
        },

        enablePointerEvents: function(enable) {
            this.frame && (this.frame.style.pointerEvents = enable ? "" : "none");
        },

        textLoading : 'Loading',
        textDock: 'Pin plugin',
        textMore: 'More'
    }, Common.Views.PluginDlg || {}));
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  CopyWarningDialog.js
 *
 *  Created on 4/15/14
 *
 */


if (Common === undefined)
    var Common = {};

define('common/main/lib/view/CopyWarningDialog',[], function () { 'use strict';

    Common.Views.CopyWarningDialog = Common.UI.Window.extend(_.extend({
        options: {
            width   : 500,
            cls     : 'modal-dlg copy-warning',
            buttons: ['ok']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle,
                buttons: ['ok']
            }, options || {});

            const app = (window.DE || window.PE || window.SSE || window.PDFE || window.VE);
            const shortcutsController =  app.getController('Common.Controllers.Shortcuts');

            const keysShortcuts = { Copy: '', Cut: '', Paste: ''};
            for (const actionType in keysShortcuts) {
                const shortcuts = shortcutsController.getShortcutsByActionType(actionType);
                if(shortcuts && shortcuts[0]) {
                    keysShortcuts[actionType] = shortcuts[0].keys.join('+');
                }
            }

            this.template = [
                '<div class="box">',
                    '<p class="message">' + this.textMsg + '</p>',
                    '<div class="hotkeys">',
                        '<div>',
                            '<p class="hotkey">' + keysShortcuts.Copy + '</p>',
                            '<p class="message">' + this.textToCopy + '</p>',
                        '</div>',
                        '<div>',
                        '<p class="hotkey">' + keysShortcuts.Cut + '</p>',
                            '<p class="message">' + this.textToCut + '</p>',
                        '</div>',
                        '<div>',
                            '<p class="hotkey">' + keysShortcuts.Paste + '</p>',
                            '<p class="message">' + this.textToPaste + '</p>',
                        '</div>',
                    '</div>',
                    '<div id="copy-warning-checkbox" class="text-align-left" style="padding: 15px 0;"></div>',
                '</div>',
                '<div class="separator horizontal"></div>'
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            this.chDontShow = new Common.UI.CheckBox({
                el: $('#copy-warning-checkbox'),
                labelText: this.textDontShow
            });

            this.getChild().find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));
        },

        getFocusedComponents: function() {
            return [this.chDontShow].concat(this.getFooterButtons());
        },

        getDefaultFocusableComponent: function () {
            return this.chDontShow;
        },

        onBtnClick: function(event) {
            if (this.options.handler) this.options.handler.call(this, this.chDontShow.getValue() == 'checked');
            this.close();
        },

        onKeyPress: function(event) {
            if (event.keyCode == Common.UI.Keys.RETURN) {
                if (this.options.handler) this.options.handler.call(this, this.chDontShow.getValue() == 'checked');
                this.close();
            }
        },

        getSettings: function() {
            return (this.chDontShow.getValue() == 'checked');
        },

        textTitle   : 'Copy, Cut and Paste Actions',
        textMsg     : 'Copy, cut and paste actions using the editor toolbar buttons and context menu actions will be performed within this editor tab only.<br><br>To copy or paste to or from applications outside the editor tab use the following keyboard combinations:',
        textToCopy  : 'for Copy',
        textToPaste : 'for Paste',
        textToCut: 'for Cut',
        textDontShow: 'Don\'t show this message again'
    }, Common.Views.CopyWarningDialog || {}))
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  TextInputDialog.js
 *
 *  Created on 17/08/24
 *
 */

define('common/main/lib/view/TextInputDialog',[], function () { 'use strict';

    Common.Views.TextInputDialog = Common.UI.Window.extend(_.extend({

        initialize : function(options) {
            var _options = {};

            _.extend(_options, {
                header: !!options.title,
                label: options.label || '',
                description: options.description || '',
                helpUrl: options.helpUrl || '',
                textReadMore: this.textReadMore,
                width: 330 || options.width,
                cls: 'modal-dlg',
                buttons: ['ok', 'cancel']
            }, options || {});

            this.template = [
                '<div class="box">',
                    '<div class="input-row <% if (!label) { %> hidden <% } %>">',
                        '<label><%= label %></label>',
                    '</div>',
                    '<div id="id-dlg-label-custom-input" class="input-row"></div>',
                    '<div class="<% if (!helpUrl) { %> input-row <% } %> <% if (!description && !helpUrl) { %> hidden <% } %>" <% if (helpUrl) { %> style="margin-bottom: 8px;" <% } %>>',
                        '<label class="light <% if (!description) { %> hidden <% } %>" <% if (helpUrl) { %> style="opacity: 0.7;" <% } %>><%= description %></label>',
                        '<label id="id-dlg-textinput-help" class="light link <% if (!helpUrl) { %> hidden <% } %>" style="margin-left: 5px;"><%= textReadMore %></label>',
                    '</div>',
                '</div>'
            ].join('');

            this.inputConfig = _.extend({
                allowBlank: true
            }, options.inputConfig || {});

            this.inputFixedConfig = options.inputFixedConfig;

            _options.tpl = _.template(this.template)(_options);
            Common.UI.Window.prototype.initialize.call(this, _options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var me = this;
            me.inputLabel = !this.inputFixedConfig ? new Common.UI.InputField({
                el          : $('#id-dlg-label-custom-input'),
                allowBlank  : me.inputConfig.allowBlank,
                blankError  : me.inputConfig.blankError,
                maxLength   : me.inputConfig.maxLength,
                style       : 'width: 100%;',
                validateOnBlur: false,
                validation  : me.inputConfig.validation
            }) : new Common.UI.InputFieldFixed({
                el          : $('#id-dlg-label-custom-input'),
                allowBlank  : me.inputConfig.allowBlank,
                blankError  : me.inputConfig.blankError,
                maxLength   : me.inputFixedConfig.fixedValue && me.inputConfig.maxLength ? me.inputConfig.maxLength - me.inputFixedConfig.fixedValue.length : me.inputConfig.maxLength,
                style       : 'width: 100%;',
                validateOnBlur: false,
                validation  : me.inputConfig.validation,
                cls         : 'text-align-left',
                fixedValue  : me.inputFixedConfig.fixedValue,
                fixedCls    : 'light',
                fixedWidth  : me.inputFixedConfig.fixedWidth
            });
            me.inputLabel.cmpEl.on('focus', 'input.fixed-text', function() {
                setTimeout(function(){me.inputLabel._input && me.inputLabel._input.focus();}, 1);
            });
            me.inputLabel.setValue(me.options.value || '');
            var $window = this.getChild();
            $window.find('.dlg-btn').on('click',     _.bind(this.onBtnClick, this));

            if (this.options.helpUrl) {
                $window.find('#id-dlg-textinput-help').on('click', function() {
                    if (me.options.helpClick) me.options.helpClick();
                    else window.open(me.options.helpUrl, '_blank');
                });
            }
        },

        getFocusedComponents: function() {
            return [{cmp: this.inputLabel, selector: 'input:not(.fixed-text)'}].concat(this.getFooterButtons());
        },

        getDefaultFocusableComponent: function () {
            return this.inputLabel;
        },

        show: function() {
            Common.UI.Window.prototype.show.apply(this, arguments);

            var me = this;
            _.delay(function(){
                me.getChild('input').focus();
            },50);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                if (state == 'ok') {
                    if (this.inputLabel.checkValidate() !== true)  {
                        this.inputLabel.cmpEl.find('input').focus();
                        return;
                    }
                }

                this.options.handler.call(this, state, this.inputLabel.getValue());
            }

            this.close();
        },

        textReadMore: 'Read more'

    }, Common.Views.TextInputDialog || {}));

    Common.Views.ImageFromUrlDialog = Common.Views.TextInputDialog.extend(_.extend({

        initialize : function(options) {

            var _options = {},
                me = this;
            _.extend(_options, {
                header: false,
                label: options.label || me.textUrl,
                inputConfig: {
                    allowBlank  : false,
                    blankError  : me.txtEmpty,
                    validation  : function(value) {
                        return (/((^https?)|(^ftp)):\/\/.+/i.test(value)) ? true : me.txtNotUrl;
                    }
                }
            }, options || {});

            Common.Views.TextInputDialog.prototype.initialize.call(this, _options);
        },

        textUrl         : 'Paste an image URL:',
        txtEmpty        : 'This field is required',
        txtNotUrl       : 'This field should be a URL in the format \"http://www.example.com\"'
    }, Common.Views.ImageFromUrlDialog || {}));
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 * Date: 09.02.15
 */

define('common/main/lib/view/SelectFileDlg',[], function () { 'use strict';

    Common.Views.SelectFileDlg = Common.UI.Window.extend(_.extend({
        initialize : function(options) {
            var _options = {};
            _.extend(_options,  {
                title: this.textTitle,
                width: 1024,
                header: true
            }, options);

            this.template = [
                '<div id="id-select-file-placeholder"></div>'
            ].join('');

            _options.tpl = _.template(this.template)(_options);

            this.fileChoiceUrl = options.fileChoiceUrl || '';
            Common.UI.Window.prototype.initialize.call(this, _options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);
            this.$window.find('> .body').css({height: 'auto', overflow: 'hidden'});

            var iframe = document.createElement("iframe");
            iframe.width        = '100%';
            iframe.height       = 585;
            iframe.align        = "top";
            iframe.frameBorder  = 0;
            iframe.scrolling    = "no";
            iframe.onload       = _.bind(this._onLoad,this);
            $('#id-select-file-placeholder').append(iframe);

            this.loadMask = new Common.UI.LoadMask({owner: $('#id-select-file-placeholder')});
            this.loadMask.setTitle(this.textLoading);
            this.loadMask.show();

            iframe.src = this.fileChoiceUrl;

            var me = this;
            this._eventfunc = function(msg) {
                me._onWindowMessage(msg);
            };
            this._bindWindowEvents.call(this);

            this.on('close', function(obj){
                me._unbindWindowEvents();
            });
        },

        _bindWindowEvents: function() {
            if (window.addEventListener) {
                window.addEventListener("message", this._eventfunc, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", this._eventfunc);
            }
        },

        _unbindWindowEvents: function() {
            if (window.removeEventListener) {
                window.removeEventListener("message", this._eventfunc)
            } else if (window.detachEvent) {
                window.detachEvent("onmessage", this._eventfunc);
            }
        },

        _onWindowMessage: function(msg) {
            // TODO: check message origin
            if (msg && window.JSON) {
                try {
                    this._onMessage.call(this, window.JSON.parse(msg.data));
                } catch(e) {}
            }
        },

        _onMessage: function(msg) {
            if (msg && msg.Referer == "onlyoffice" && msg.file !== undefined) {
                Common.NotificationCenter.trigger('window:close', this);
                var me = this;
                setTimeout(function() {
                    if ( !_.isEmpty(msg.file) ) {
                        me.trigger('selectfile', me, msg.file);
                    }
                }, 50);
            }
        },

        _onLoad: function() {
            if (this.loadMask)
                this.loadMask.hide();
        },

        textTitle   : 'Select Data Source',
        textLoading : 'Loading'
    }, Common.Views.SelectFileDlg || {}));
});

/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  Created on 9/27/18
 */

define('common/main/lib/view/SaveAsDlg',[], function () { 'use strict';

    Common.Views.SaveAsDlg = Common.UI.Window.extend(_.extend({
        initialize : function(options) {
            var _options = {};
            _.extend(_options,  {
                title: this.textTitle,
                width: 420,
                header: true
            }, options);

            this.template = [
                '<div id="id-saveas-folder-placeholder"></div>'
            ].join('');

            _options.tpl = _.template(this.template)(_options);

            this.saveFolderUrl = options.saveFolderUrl || '';
            this.saveFileUrl = options.saveFileUrl || '';
            this.defFileName = options.defFileName || '';
            this.saveFolderUrl = this.saveFolderUrl.replace("{title}", encodeURIComponent(this.defFileName)).replace("{fileuri}", encodeURIComponent(this.saveFileUrl));
            Common.UI.Window.prototype.initialize.call(this, _options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);
            this.$window.find('> .body').css({height: 'auto', overflow: 'hidden'});

            var iframe = document.createElement("iframe");
            iframe.width        = '100%';
            iframe.height       = 645;
            iframe.align        = "top";
            iframe.frameBorder  = 0;
            iframe.scrolling    = "no";
            iframe.onload       = _.bind(this._onLoad,this);
            $('#id-saveas-folder-placeholder').append(iframe);

            this.loadMask = new Common.UI.LoadMask({owner: $('#id-saveas-folder-placeholder')});
            this.loadMask.setTitle(this.textLoading);
            this.loadMask.show();

            iframe.src = this.saveFolderUrl;

            var me = this;
            this._eventfunc = function(msg) {
                me._onWindowMessage(msg);
            };
            this._bindWindowEvents.call(this);

             this.on('close', function(obj){
                me._unbindWindowEvents();
            });
        },

        _bindWindowEvents: function() {
            if (window.addEventListener) {
                window.addEventListener("message", this._eventfunc, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmessage", this._eventfunc);
            }
        },

        _unbindWindowEvents: function() {
            if (window.removeEventListener) {
                window.removeEventListener("message", this._eventfunc)
            } else if (window.detachEvent) {
                window.detachEvent("onmessage", this._eventfunc);
            }
        },

        _onWindowMessage: function(msg) {
            // TODO: check message origin
            if (msg && window.JSON) {
                try {
                    this._onMessage.call(this, window.JSON.parse(msg.data));
                } catch(e) {}
            }
        },

        _onMessage: function(msg) {
            if (msg && msg.Referer == "onlyoffice") {
                if ( !_.isEmpty(msg.error) ) {
                    this.trigger('saveaserror', this, msg.error);
                } else if (!_.isEmpty(msg.message)) {
                    Common.NotificationCenter.trigger('showmessage', {msg: msg.message});
                }
//                if ( !_.isEmpty(msg.folder) ) {
//                    this.trigger('saveasfolder', this, msg.folder); // save last folder url
//                }
                Common.NotificationCenter.trigger('window:close', this);
            }
        },

        _onLoad: function() {
            if (this.loadMask)
                this.loadMask.hide();
        },

        textTitle   : 'Folder for save',
        textLoading : 'Loading'
    }, Common.Views.SaveAsDlg || {}));
});


/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  SignDialog.js
 *
 *  Created on 5/19/17
 *
 */


if (Common === undefined)
    var Common = {};

define('common/main/lib/view/SignDialog',[], function () { 'use strict';

    Common.Views.SignDialog = Common.UI.Window.extend(_.extend({
        options: {
            width: 370,
            style: 'min-width: 350px;',
            cls: 'modal-dlg',
            buttons: ['ok', 'cancel']
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle
            }, options || {});

            this.api = this.options.api;
            this.signType = this.options.signType || 'invisible';
            this.signSize = this.options.signSize || {width: 0, height: 0};
            this.certificateId = null;
            this.signObject = null;
            this.fontStore = this.options.fontStore;
            this.font = {
                size: 11,
                name: 'Arial',
                bold: false,
                italic: false
            };
            var filter = Common.localStorage.getKeysFilter();
            this.appPrefix = (filter && filter.length) ? filter.split(',')[0] : '';

            this.template = [
                '<div class="box" style="height: ' + ((this.signType == 'invisible') ? '132px;' : '300px;') + '">',
                    '<div id="id-dlg-sign-invisible">',
                        '<div class="input-row">',
                            '<label>' + this.textPurpose + '</label>',
                        '</div>',
                        '<div id="id-dlg-sign-purpose" class="input-row"></div>',
                    '</div>',
                    '<div id="id-dlg-sign-visible">',
                        '<div class="input-row">',
                            '<label>' + this.textInputName + '</label>',
                        '</div>',
                        '<div id="id-dlg-sign-name" class="input-row" style="margin-bottom: 5px;"></div>',
                        '<div id="id-dlg-sign-fonts" class="input-row" style="display: inline-block;vertical-align: middle;"></div>',
                        '<div id="id-dlg-sign-font-size" class="input-row margin-left-3" style="display: inline-block;vertical-align: middle;"></div>',
                        '<div id="id-dlg-sign-bold" class="margin-left-3" style="display: inline-block;vertical-align: middle;"></div>','<div id="id-dlg-sign-italic" class="margin-left-3" style="display: inline-block;vertical-align: middle;"></div>',
                        '<div style="margin: 10px 0 5px 0;">',
                            '<label>' + this.textUseImage + '</label>',
                        '</div>',
                        '<button id="id-dlg-sign-image" class="btn btn-text-default auto">' + this.textSelectImage + '</button>',
                        '<div class="input-row" style="margin-top: 10px;">',
                            '<label class="font-weight-bold">' + this.textSignature + '</label>',
                        '</div>',
                        '<div style="border: 1px solid #cbcbcb;"><div id="signature-preview-img" style="width: 100%; height: 50px;position: relative;"></div></div>',
                    '</div>',
                    '<table style="margin-top: 30px;">',
                        '<tr>',
                            '<td><label class="font-weight-bold" style="margin-bottom: 3px;">' + this.textCertificate + '</label></td>' +
                            '<td rowspan="2" class="padding-left-20" style="vertical-align: top;"><button id="id-dlg-sign-change" class="btn btn-text-default float-right">' + this.textSelect + '</button></td>',
                        '</tr>',
                        '<tr><td><div id="id-dlg-sign-certificate" class="hidden" style="max-width: 240px;overflow: hidden;white-space: nowrap;"></td></tr>',
                    '</table>',
                '</div>'
            ].join('');

            this.templateCertificate = _.template([
                '<label style="display: block;margin-bottom: 3px;overflow: hidden;text-overflow: ellipsis;"><%= Common.Utils.String.htmlEncode(name) %></label>',
                '<label style="display: block;"><%= Common.Utils.String.htmlEncode(valid) %></label>'
            ].join(''));

            this.options.tpl = _.template(this.template)(this.options);

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var me = this,
                $window = this.getChild();

            me.inputPurpose = new Common.UI.InputField({
                el          : $('#id-dlg-sign-purpose'),
                style       : 'width: 100%;'
            });

            me.inputName = new Common.UI.InputField({
                el          : $('#id-dlg-sign-name'),
                style       : 'width: 100%;',
                validateOnChange: true
            }).on ('changing', _.bind(me.onChangeName, me));

            me.cmbFonts = new Common.UI.ComboBoxFonts({
                el          : $('#id-dlg-sign-fonts'),
                cls         : 'input-group-nr',
                style       : 'width: 230px;',
                menuCls     : 'scrollable-menu',
                menuStyle   : 'min-width: 230px;max-height: 270px;',
                store       : new Common.Collections.Fonts(),
                recent      : 0,
                takeFocusOnClose: true,
                hint        : me.tipFontName
            }).on('selected', function(combo, record) {
                if (me.signObject) {
                    me.signObject.setText(me.inputName.getValue(), record.name, me.font.size, me.font.italic, me.font.bold);
                }
                me.font.name = record.name;
            });

            this.cmbFontSize = new Common.UI.ComboBox({
                el: $('#id-dlg-sign-font-size'),
                cls: 'input-group-nr',
                style: 'width: 50px;',
                menuCls     : 'scrollable-menu',
                menuStyle: 'min-width: 50px;max-height: 270px;',
                hint: this.tipFontSize,
                takeFocusOnClose: true,
                data: [
                    { value: 8, displayValue: "8" },
                    { value: 9, displayValue: "9" },
                    { value: 10, displayValue: "10" },
                    { value: 11, displayValue: "11" },
                    { value: 12, displayValue: "12" },
                    { value: 14, displayValue: "14" },
                    { value: 16, displayValue: "16" },
                    { value: 18, displayValue: "18" },
                    { value: 20, displayValue: "20" },
                    { value: 22, displayValue: "22" },
                    { value: 24, displayValue: "24" },
                    { value: 26, displayValue: "26" },
                    { value: 28, displayValue: "28" },
                    { value: 36, displayValue: "36" },
                    { value: 48, displayValue: "48" },
                    { value: 72, displayValue: "72" },
                    { value: 96, displayValue: "96" }
                ]
            }).on('selected', function(combo, record) {
                if (me.signObject) {
                    me.signObject.setText(me.inputName.getValue(), me.font.name, record.value, me.font.italic, me.font.bold);
                }
                me.font.size = record.value;
            });
            this.cmbFontSize.setValue(this.font.size);
            this.cmbFontSize.on('changed:before', _.bind(this.onFontSizeChanged, this, true));
            this.cmbFontSize.on('changed:after',  _.bind(this.onFontSizeChanged, this, false));

            me.btnBold = new Common.UI.Button({
                parentEl: $('#id-dlg-sign-bold'),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-bold',
                enableToggle: true,
                hint: me.textBold
            });
            me.btnBold.on('click', function(btn, e) {
                if (me.signObject) {
                    me.signObject.setText(me.inputName.getValue(), me.font.name, me.font.size, me.font.italic, btn.pressed);
                }
                me.font.bold = btn.pressed;
            });

            me.btnItalic = new Common.UI.Button({
                parentEl: $('#id-dlg-sign-italic'),
                cls: 'btn-toolbar',
                iconCls: 'toolbar__icon btn-italic',
                enableToggle: true,
                hint: me.textItalic
            });
            me.btnItalic.on('click', function(btn, e) {
                if (me.signObject) {
                    me.signObject.setText(me.inputName.getValue(), me.font.name, me.font.size, btn.pressed, me.font.bold);
                }
                me.font.italic = btn.pressed;
            });

            me.btnSelectImage = new Common.UI.Button({
                el: '#id-dlg-sign-image'
            });
            me.btnSelectImage.on('click', _.bind(me.onSelectImage, me));

            me.btnChangeCertificate = new Common.UI.Button({
                el: '#id-dlg-sign-change'
            });
            me.btnChangeCertificate.on('click', _.bind(me.onChangeCertificate, me));

            me.btnOk = _.find(this.getFooterButtons(), function (item) {
                return (item.$el && item.$el.find('.primary').addBack().filter('.primary').length>0);
            }) || new Common.UI.Button({ el: $window.find('.primary') });
            me.btnOk.setDisabled(true);

            me.cntCertificate = $('#id-dlg-sign-certificate');
            me.cntVisibleSign = $('#id-dlg-sign-visible');
            me.cntInvisibleSign = $('#id-dlg-sign-invisible');

            (me.signType == 'visible') ? me.cntInvisibleSign.addClass('hidden') : me.cntVisibleSign.addClass('hidden');

            $window.find('.dlg-btn').on('click', _.bind(me.onBtnClick, me));

            me.afterRender();
        },

        getFocusedComponents: function() {
            return [this.inputPurpose, this.inputName, this.cmbFonts, this.cmbFontSize, this.btnBold, this.btnItalic, this.btnSelectImage, this.btnChangeCertificate].concat(this.getFooterButtons());
        },

        show: function() {
            Common.UI.Window.prototype.show.apply(this, arguments);

            var me = this;
            _.delay(function(){
                ((me.signType == 'visible') ? me.inputName : me.inputPurpose).cmpEl.find('input').focus();
            },500);
        },

        close: function() {
            this.api.asc_unregisterCallback('on_signature_defaultcertificate_ret', this.binding.certificateChanged);
            this.api.asc_unregisterCallback('on_signature_selectsertificate_ret', this.binding.certificateChanged);

            Common.UI.Window.prototype.close.apply(this, arguments);

            if (this.signObject)
                this.signObject.destroy();
        },

        afterRender: function () {
            if (this.api) {
                if (!this.binding)
                    this.binding = {};
                this.binding.certificateChanged = _.bind(this.onCertificateChanged, this);
                this.api.asc_registerCallback('on_signature_defaultcertificate_ret', this.binding.certificateChanged);
                this.api.asc_registerCallback('on_signature_selectsertificate_ret', this.binding.certificateChanged);
                this.api.asc_GetDefaultCertificate();
            }

            if (this.signType == 'visible') {
                this.cmbFonts.fillFonts(this.fontStore);
                this.cmbFonts.selectRecord(this.fontStore.findWhere({name: this.font.name}) || this.fontStore.at(0));

                this.signObject = new AscCommon.CSignatureDrawer('signature-preview-img', this.api, this.signSize.width, this.signSize.height);
            }
        },

        getSettings: function () {
            var props = {};
            props.certificateId = this.certificateId;
            if (this.signType == 'invisible') {
                props.purpose = this.inputPurpose.getValue();
            } else {
                props.images = this.signObject ? this.signObject.getImages() : [null, null];
            }

            return props;
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                if (state == 'ok' && (this.btnOk.isDisabled() || this.signObject && !this.signObject.isValid())) {
                    if (!this.btnOk.isDisabled()) {
                        this.inputName.showError([this.textNameError]);
                        this.inputName.focus();
                    }
                    return;
                }


                this.options.handler.call(this, this, state);
            }
            this.close();
        },

        onChangeCertificate: function() {
            this.api.asc_SelectCertificate();
        },

        onCertificateChanged: function(certificate) {
            this.certificateId = certificate.id;
            var date = certificate.date,
                arr_date = (typeof date == 'string') ? date.split(' - ') : ['', ''];
            this.cntCertificate.html(this.templateCertificate({name: certificate.name, valid: this.textValid.replace('%1', arr_date[0]).replace('%2', arr_date[1])}));
            this.cntCertificate.toggleClass('hidden', _.isEmpty(this.certificateId) || this.certificateId<0);
            this.btnChangeCertificate.setCaption((_.isEmpty(this.certificateId) || this.certificateId<0) ? this.textSelect : this.textChange);
            this.btnOk.setDisabled(_.isEmpty(this.certificateId) || this.certificateId<0);
        },

        onSelectImage: function() {
            if (!this.signObject) return;
            this.signObject.selectImage();
            this.inputName.setValue('');
        },

        onChangeName: function (input, value) {
            if (!this.signObject) return;
            this.signObject.setText(value, this.font.name, this.font.size, this.font.italic, this.font.bold);
        },

        onFontSizeChanged: function(before, combo, record, e) {
            var value,
                me = this;

            if (before) {
                var item = combo.store.findWhere({
                    displayValue: record.value
                });

                if (!item) {
                    value = /^\+?(\d*(\.|,)?\d+)$|^\+?(\d+(\.|,)?\d*)$/.exec(record.value);

                    if (!value) {
                        value = combo.getValue();
                        combo.setRawValue(value);
                        e.preventDefault();
                        return false;
                    }
                }
            } else {
                var maxvalue = (this.appPrefix=='sse-') ? 409 : 300;
                value = Common.Utils.String.parseFloat(record.value);
                value = value > maxvalue ? maxvalue :
                    value < 1 ? 1 : Math.floor((value+0.4)*2)/2;

                combo.setRawValue(value);
                if (this.signObject) {
                    this.signObject.setText(this.inputName.getValue(), this.font.name, value, this.font.italic, this.font.bold);
                }
                this.font.size = value;
            }
        },

        textTitle:          'Sign Document',
        textPurpose:        'Purpose for signing this document',
        textCertificate:    'Certificate',
        textValid:          'Valid from %1 to %2',
        textChange:         'Change',
        textInputName:      'Input signer name',
        textUseImage:       'or click \'Select Image\' to use a picture as signature',
        textSelectImage:    'Select Image',
        textSignature:      'Signature looks as',
        tipFontName: 'Font Name',
        tipFontSize: 'Font Size',
        textBold:           'Bold',
        textItalic:         'Italic',
        textSelect: 'Select',
        textNameError: 'Signer name must not be empty.'

    }, Common.Views.SignDialog || {}))
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  SignSettingsDialog.js
 *
 *  Created on 5/19/17
 *
 */


if (Common === undefined)
    var Common = {};

define('common/main/lib/view/SignSettingsDialog',[], function () { 'use strict';

    Common.Views.SignSettingsDialog = Common.UI.Window.extend(_.extend({
        options: {
            width: 350,
            style: 'min-width: 350px;',
            cls: 'modal-dlg',
            type: 'edit'
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.textTitle,
                buttons: ['ok'].concat((options.type || this.options.type) === 'edit' ? ['cancel'] : []),
            }, options || {});

            this.template = [
                '<div class="box" style="height: 250px;">',
                    '<div class="input-row">',
                        '<label>' + this.textInfoName + '</label>',
                    '</div>',
                    '<div id="id-dlg-sign-settings-name" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div class="input-row">',
                        '<label>' + this.textInfoTitle + '</label>',
                    '</div>',
                    '<div id="id-dlg-sign-settings-title" class="input-row" style="margin-bottom: 5px;"></div>',
                    '<div class="input-row">',
                        '<label>' + this.textInfoEmail + '</label>',
                    '</div>',
                    '<div id="id-dlg-sign-settings-email" class="input-row" style="margin-bottom: 10px;"></div>',
                    '<div class="input-row">',
                        '<label>' + this.textInstructions + '</label>',
                    '</div>',
                    '<div id="id-dlg-sign-settings-instructions"></div>',
                    '<div id="id-dlg-sign-settings-date"></div>',
                '</div>'
            ].join('');

            this.api = this.options.api;
            this.type = this.options.type || 'edit';
            this.options.tpl = _.template(this.template)(this.options);

            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var me = this,
                $window = this.getChild();

            me.inputName = new Common.UI.InputField({
                el          : $('#id-dlg-sign-settings-name'),
                style       : 'width: 100%;',
                disabled    : this.type=='view'
            });

            me.inputTitle = new Common.UI.InputField({
                el          : $('#id-dlg-sign-settings-title'),
                style       : 'width: 100%;',
                disabled    : this.type=='view'
            });

            me.inputEmail = new Common.UI.InputField({
                el          : $('#id-dlg-sign-settings-email'),
                style       : 'width: 100%;',
                disabled    : this.type=='view'
            });

            me.textareaInstructions = new Common.UI.TextareaField({
                el          : $window.find('#id-dlg-sign-settings-instructions'),
                style       : 'width: 100%; height: 35px;margin-bottom: 10px;',
                value       : this.textDefInstruction,
                disabled    : this.type=='view'
            });

            this.chDate = new Common.UI.CheckBox({
                el: $('#id-dlg-sign-settings-date'),
                labelText: this.textShowDate,
                disabled: this.type=='view',
                value: 'checked'
            });

            $window.find('.dlg-btn').on('click', _.bind(this.onBtnClick, this));
        },

        getFocusedComponents: function() {
            return [this.inputName, this.inputTitle, this.inputEmail, this.textareaInstructions, this.chDate].concat(this.getFooterButtons());
        },

        getDefaultFocusableComponent: function () {
            return this.inputName;
        },

        setSettings: function (props) {
            if (props) {
                var me = this;

                var value = props.asc_getSigner1();
                me.inputName.setValue(value ? value : '');
                value = props.asc_getSigner2();
                me.inputTitle.setValue(value ? value : '');
                value = props.asc_getEmail();
                me.inputEmail.setValue(value ? value : '');
                value = props.asc_getInstructions();
                me.textareaInstructions.setValue(value ? value : '');
                me.chDate.setValue(props.asc_getShowDate());

                me._currentGuid = props.asc_getGuid();
            }
        },

        getSettings: function () {
            var me = this,
                props = new AscCommon.asc_CSignatureLine();

            props.asc_setSigner1(me.inputName.getValue());
            props.asc_setSigner2(me.inputTitle.getValue());
            props.asc_setEmail(me.inputEmail.getValue());
            props.asc_setInstructions(me.textareaInstructions.getValue());
            props.asc_setShowDate(me.chDate.getValue()=='checked');
            (me._currentGuid!==undefined) && props.asc_setGuid(me._currentGuid);

            return props;
        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        _handleInput: function(state) {
            if (this.options.handler)
                this.options.handler.call(this, this, state);
            this.close();
        },

        textInfo:           'Signer Info',
        textInfoName:       'Suggested signer',
        textInfoTitle:      'Suggested signer\'s title',
        textInfoEmail:      'Suggested signer\'s e-mail',
        textInstructions:   'Instructions for signer',
        txtEmpty:           'This field is required',
        textAllowComment:   'Allow signer to add comment in the signature dialog',
        textShowDate:       'Show sign date in signature line',
        textTitle:          'Signature Setup',
        textDefInstruction: 'Before signing this document, verify that the content you are signing is correct.'
    }, Common.Views.SignSettingsDialog || {}))
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  PdfSignDialog.js
 *
 *  Created on 26/08/24
 *
 */


define('common/main/lib/view/PdfSignDialog',[], function () { 'use strict';
    Common.Views.PdfSignDialog = Common.UI.Window.extend(_.extend({
        options: {
            width: 535,
            style: 'min-width: 350px;',
            cls: 'modal-dlg',
            buttons: ['ok', 'cancel'],
            id: 'window-pdf-sign'
        },

        initialize : function(options) {
            _.extend(this.options, {
                title: this.txtTitle
            }, options || {});

            this.api = this.options.api;
            this.props = this.options.props;
            this.fontStore = this.options.fontStore;
            this.hasField = this.options.hasField !== false;
            this.mode = 0; // 0 - upload, 1 - draw, 2 - type
            this.storage    = !!this.options.storage;
            this.isImageLoaded = false;
            this.iconType = this.options.iconType;
            this.font = {
                size: 11,
                name: 'Arial',
                bold: false,
                italic: false
            };

            this.template = [
                '<div class="box">',
                    '<label style="display: block; margin-bottom: 10px;">' + this.textBefore + '</label>',
                    '<div style="margin-bottom: 15px;">',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-pdf-btn-upload">' + this.txtUpload + '</button>',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-pdf-btn-draw">' + this.txtDraw + '</button>',
                        '<button type="button" class="btn btn-text-default auto" id="id-dlg-pdf-btn-type">' + this.txtType + '</button>',
                    '</div>',
                    '<label style="display: block; margin-bottom: 3px;">' + this.textLooksAs + '</label>',
                    '<div style="outline: 1px solid #cbcbcb;width: 500px; height: 150px;">',
                        '<div class="img-upload" style="width: 100%; height: 100%;">',
                            '<div id="pdf-sign-img-upload" style="width: 100%; height: 100%; display: flex; flex-direction:column; align-items: center;">',
                                '<table style="height: 100%; width: 60%;text-align: center;">',
                                    '<tr>',
                                        '<td><div id="id-dlg-pdf-select-image"></div><div><label class="light" style="margin-top:10px;">' + this.txtUploadDesc + '</div></label></div>',
                                    '</tr>',
                                '</table>',
                            '</div>',
                            '<div id="pdf-sign-img-upload-preview" class="hidden" style="width: 100%; height: 100%; position: relative; margin: 0 auto;"></div>',
                        '</div>',
                        '<div id="pdf-sign-img-draw-preview" class="img-draw hidden" style="width: 100%; height: 100%; position: relative; margin: 0 auto;"></div>',
                        '<div id="pdf-sign-img-type-preview" class="img-type hidden" style="width: 100%; height: 100%; position: relative; margin: 0 auto;"></div>',
                    '</div>',
                    '<div class="input-row display-flex-row-center" style="margin: 10px 0;">',
                        '<div id="pdf-sign-ch-back" class="img-upload"></div>',
                        '<div id="pdf-sign-name" class="img-type hidden"></div>',
                        '<div id="pdf-sign-fonts" class="img-type hidden margin-left-5"></div>',
                        '<div id="pdf-sign-font-size" class="img-type hidden margin-left-5"></div>',
                        '<div id="pdf-sign-bold" class="img-type hidden margin-left-5"></div>','<div id="pdf-sign-italic" class="img-type hidden margin-left-5" ></div>',
                        '<div id="pdf-sign-line-size" class="img-draw margin-right-5 hidden"></div>',
                        '<div id="pdf-sign-line-color" class="img-draw hidden"></div>',
                        '<div style="flex-grow: 1;display: flex; justify-content: center;"><div id="btn-sign-undo" class="img-draw margin-right-5 hidden"></div><div id="btn-sign-redo" class="img-draw hidden"></div></div>',
                        '<button type="button" class="btn btn-text-default auto" id="pdf-sign-btn-clear">' + this.textClear + '</button>',
                    '</div>',
                    '<div id="pdf-sign-ch-save" class="input-row" style="margin: 0 0 5px;"></div>',
                '</div>',
            ].join('');

            this.options.tpl = _.template(this.template)(this.options);
            Common.UI.Window.prototype.initialize.call(this, this.options);
        },

        render: function() {
            Common.UI.Window.prototype.render.call(this);

            var me = this,
                $window = this.getChild(),
                is_svg_icon = this.iconType === 'svg';

            this.btnUpload = new Common.UI.Button({
                el: $window.find('#id-dlg-pdf-btn-upload'),
                enableToggle: true,
                toggleGroup: 'pdf-img-type',
                allowDepress: false,
                pressed: true
            });
            this.btnUpload.on('click', _.bind(this.onImgModeClick, this, 0));

            this.btnDraw = new Common.UI.Button({
                el: $window.find('#id-dlg-pdf-btn-draw'),
                enableToggle: true,
                toggleGroup: 'pdf-img-type',
                allowDepress: false
            });
            this.btnDraw.on('click', _.bind(this.onImgModeClick, this, 1));

            this.btnType = new Common.UI.Button({
                el: $window.find('#id-dlg-pdf-btn-type'),
                enableToggle: true,
                toggleGroup: 'pdf-img-type',
                allowDepress: false
            });
            this.btnType.on('click', _.bind(this.onImgModeClick, this, 2));
            Common.UI.GroupedButtons([me.btnUpload, me.btnDraw, me.btnType]);

            this.btnSelectImage = new Common.UI.Button({
                parentEl: $window.find('#id-dlg-pdf-select-image'),
                cls: 'btn-text-menu-default',
                caption: this.textSelect,
                style: 'min-width: 142px;',
                menu: new Common.UI.Menu({
                    style: 'min-width: 142px;',
                    maxHeight: 200,
                    additionalAlign: this.menuAddAlign,
                    items: [
                        {caption: this.textFromFile, value: 0},
                        {caption: this.textFromUrl, value: 1},
                        {caption: this.textFromStorage, value: 2}
                    ]
                }),
                takeFocusOnClose: true
            });
            this.btnSelectImage.menu.on('item:click', _.bind(this.onImageSelect, this));
            this.btnSelectImage.menu.items[2].setVisible(this.storage);
            this.btnSelectImage.menu.items[1].setDisabled(this.options.disableNetworkFunctionality);
            this.btnSelectImage.menu.items[2].setDisabled(this.options.disableNetworkFunctionality);

            this.chRemBack = new Common.UI.CheckBox({
                el: $window.find('#pdf-sign-ch-back'),
                labelText: this.txtRemBack
            });
            this.chRemBack.setDisabled(true);
            this.chRemBack.on('change', function(field, newValue, oldValue, eOpts){
                me.props && me.props.put_RemoveBackground(field.getValue()==='checked');
            });

            this.chSave = new Common.UI.CheckBox({
                el: $window.find('#pdf-sign-ch-save'),
                labelText: this.txtSaveSignature,
                value: 'checked'
            });

            this.cmbFonts = new Common.UI.ComboBoxFonts({
                el          : $window.find('#pdf-sign-fonts'),
                cls         : 'input-group-nr',
                style       : 'width: 100px;',
                menuCls     : 'scrollable-menu',
                menuStyle   : 'min-width: 100%;max-height: 270px;',
                store       : new Common.Collections.Fonts(),
                recent      : 0,
                takeFocusOnClose: true
            }).on('selected', function(combo, record) {
                me.font.name = record.name;
                me.props && me.props.put_TypeFont(record.name);
            });

            this.cmbFontSize = new Common.UI.ComboBox({
                el: $window.find('#pdf-sign-font-size'),
                cls: 'input-group-nr',
                style: 'width: 50px;',
                menuCls     : 'scrollable-menu',
                menuStyle: 'min-width: 50px;max-height: 270px;',
                data: [
                    { value: 8, displayValue: "8" },
                    { value: 9, displayValue: "9" },
                    { value: 10, displayValue: "10" },
                    { value: 11, displayValue: "11" },
                    { value: 12, displayValue: "12" },
                    { value: 14, displayValue: "14" },
                    { value: 16, displayValue: "16" },
                    { value: 18, displayValue: "18" },
                    { value: 20, displayValue: "20" },
                    { value: 22, displayValue: "22" },
                    { value: 24, displayValue: "24" },
                    { value: 26, displayValue: "26" },
                    { value: 28, displayValue: "28" },
                    { value: 36, displayValue: "36" },
                    { value: 48, displayValue: "48" },
                    { value: 72, displayValue: "72" },
                    { value: 96, displayValue: "96" }
                ],
                takeFocusOnClose: true
            }).on('selected', function(combo, record) {
                me.font.size= record.value;
                me.props && me.props.put_TypeFontSize(record.value);
            });
            this.cmbFontSize.setValue(this.font.size);
            this.cmbFontSize.on({
                'changed:before': this.onFontSizeChanged.bind(this, true),
                'changed:after': this.onFontSizeChanged.bind(this, false),
            });

            this.btnBold = new Common.UI.Button({
                parentEl: $window.find('#pdf-sign-bold'),
                cls: 'btn-toolbar',
                iconCls: is_svg_icon ? 'svg-icon bold scaling-off' : 'toolbar__icon btn-bold',
                enableToggle: true,
                hint: this.textBold
            });
            this.btnBold.on('click', function(btn, e) {
                me.font.bold = btn.pressed;
                me.props && me.props.put_TypeBold(btn.pressed);
            });

            this.btnItalic = new Common.UI.Button({
                parentEl: $window.find('#pdf-sign-italic'),
                cls: 'btn-toolbar',
                iconCls: is_svg_icon ? 'svg-icon italic scaling-off' : 'toolbar__icon btn-italic',
                enableToggle: true,
                hint: this.textItalic
            });
            this.btnItalic.on('click', function(btn, e) {
                me.font.italic = btn.pressed;
                me.props && me.props.put_TypeItalic(btn.pressed);
            });

            this.inputName = new Common.UI.InputField({
                el: $window.find('#pdf-sign-name'),
                style: 'width: 150px;',
                validateOnChange: true
            }).on ('changing', _.bind(this.onChangeName, this));

            this.btnLineColor = new Common.UI.ColorButton({
                parentEl: $window.find('#pdf-sign-line-color'),
                additionalAlign: this.menuAddAlign,
                color: 'auto',
                auto: true,
                menu: true,
                ariaLabel: this.textColor,
                takeFocusOnClose: true
            });

            this.btnLineColor.setMenu(new Common.UI.Menu({
                style: 'min-width: 100px;',
                items: [
                    {
                        template: _.template('<div id="id-sign-window-draw-line-color" style="width: 174px; display: inline-block;" class="palette-large"></div>'),
                        stopPropagation: true
                    },
                    {
                        id: 'sign-draw-line-color-new',
                        template: _.template('<a tabindex="-1" type="menuitem" style="">' + this.btnLineColor.textNewColor + '</a>')
                    },
                ]
            }), true);

            // color
            const currentColor = '000000';
            this.btnLineColor.currentColor = currentColor;
            this.btnLineColor.setColor(currentColor);
            const picker = new Common.UI.ThemeColorPalette({
                    el: $('#id-sign-window-draw-line-color'),
                    colors: [
                        '1755A0', 'D43230', 'F5C346', 'EA3368', '12A489', '552F8B', '9D1F87', 'BB2765', '479ED2', '67C9FA',
                        '3D8A44', '80CA3D', '1C19B4', '7F4B0F', 'FF7E07', 'FFFFFF', 'D3D3D4', '879397', '575757', '000000'
                    ],
                    value: currentColor,
                    dynamiccolors: 5,
                    themecolors: 0,
                    effects: 0,
                    columns: 5,
                    outerMenu: {menu: this.btnLineColor.menu, index: 0, focusOnShow: true},
                    storageSuffix: '-sign'
                });
            this.btnLineColor.setPicker(picker);
            picker.on('select', this.onColorsLineSelect.bind(this));
            this.btnLineColor.menu.setInnerMenu([{menu: picker, index: 0}]);
            this.btnLineColor.menu.cmpEl.find('#sign-draw-line-color-new').on('click',  function() {
                picker.addNewColor(me.btnLineColor.currentColor);
            });

            var data = [];
            for (var i=1; i<6; i++) {
                data.push({ value: i, displayValue: i + ' px' });
            }
            this.cmbLineSize = new Common.UI.ComboBox({
                el: $window.find('#pdf-sign-line-size'),
                cls: 'input-group-nr',
                style: 'width: 50px;',
                menuCls     : 'scrollable-menu',
                menuStyle: 'min-width: 50px;max-height: 270px;',
                data: data,
                takeFocusOnClose: true
            });
            this.cmbLineSize.setValue(2);
            this.cmbLineSize.on({
                'selected': function(combo, record) {
                                me.props && me.props.put_LineSize(record.value);
                            },
                'changed:before': this.onLineSizeChanged.bind(this),
            });

            this.btnUndo = new Common.UI.Button({
                parentEl    : $window.find('#btn-sign-undo'),
                cls         : 'btn-toolbar',
                iconCls     : is_svg_icon ? 'svg-icon undo icon-rtl scaling-off' : 'toolbar__icon btn-undo icon-rtl',
                hint        : this.tipUndo
            }).on('click', _.bind(this.onUndo, this));

            this.btnRedo = new Common.UI.Button({
                parentEl    : $window.find('#btn-sign-redo'),
                cls         : 'btn-toolbar',
                iconCls     : is_svg_icon ? 'svg-icon redo icon-rtl scaling-off' : 'toolbar__icon btn-redo icon-rtl',
                hint        : this.tipRedo
            }).on('click', _.bind(this.onRedo, this));

            this.btnClear = new Common.UI.Button({
                el: $window.find('#pdf-sign-btn-clear')
            });
            this.btnClear.on('click', _.bind(this.onClear, this));

            this.imgUploadPnl = $window.find('.img-upload');
            this.imgDrawPnl = $window.find('.img-draw');
            this.imgTypePnl = $window.find('.img-type');
            this.uploadEmptyPnl = $window.find('#pdf-sign-img-upload');
            this.uploadPreviewPnl = $window.find('#pdf-sign-img-upload-preview');

            this.btnOk = _.find(this.getFooterButtons(), function (item) {
                return (item.$el && item.$el.find('.primary').addBack().filter('.primary').length>0);
            }) || new Common.UI.Button({ el: this.$window.find('.primary') });
            this.btnOk.setDisabled(true);

            this.afterRender();
        },

        getFocusedComponents: function() {
            return [this.btnUpload, this.btnDraw, this.btnType, this.btnSelectImage, this.chRemBack, this.cmbLineSize, this.btnLineColor,
                    this.inputName, this.cmbFonts, this.cmbFontSize, this.btnBold, this.btnItalic, this.btnUndo, this.btnRedo, this.chSave, this.btnClear].concat(this.getFooterButtons());
        },

        getDefaultFocusableComponent: function () {
        },

        afterRender: function() {
            this.cmbFonts.fillFonts(this.fontStore);
            this.cmbFonts.selectRecord(this.fontStore.findWhere({name: this.font.name}));

            this.updateThemeColors();
            this._setDefaults(this.props);

            var me = this;
            var onApiImgLoaded = function() {
                me.isImageLoaded = true;
                me.uploadEmptyPnl.toggleClass('hidden', true);
                me.uploadPreviewPnl.toggleClass('hidden', false);
                me.props.updateView(0);
                me.btnOk.setDisabled(false);
                me.chRemBack.setDisabled(false);
            };
            this.api.asc_registerCallback('asc_onSignatureImageLoaded', onApiImgLoaded);

            var onCanUndoChanged = function(canUndo) {
                me.btnUndo.setDisabled(!canUndo);
            };
            var onCanRedoChanged = function(canRedo) {
                me.btnRedo.setDisabled(!canRedo);
            };
            this.api.asc_registerCallback('asc_CanUndoSignature', onCanUndoChanged);
            this.api.asc_registerCallback('asc_CanRedoSignature', onCanRedoChanged);

            var insertImageFromStorage = function(data) {
                if (data && data._urls && data.c==='signature') {
                    me.props.put_ImageUrl(data._urls[0], data.token);
                }
            };
            Common.NotificationCenter.on('storage:image-insert', insertImageFromStorage);

            me.uploadEmptyPnl.parent().on({
                dragover: function(e) {
                    var event = e.originalEvent;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                    return false;
                },
                drop: function(e) {
                    var event = e.originalEvent;
                    event.preventDefault();
                    var files = event.dataTransfer.files;
                    if (files && files.length > 0) me.props && me.props.putFile(files[0]);
                    return false;
                }
            });
              
            me.keydownHandler = function(e) {
                if (!(me.$window && me.$window.is(':visible'))) return;
                if (me.mode !== 1) return;

                var ctrlKey = e.ctrlKey || e.metaKey;
                if (!ctrlKey) return;

                if (e.keyCode === 90 && !e.shiftKey) {
                    if (!me.btnUndo.isDisabled()) {
                        me.onUndo();
                        e.preventDefault();
                    }
                } else if (e.keyCode === 89 || (e.keyCode === 90 && e.shiftKey)) {
                    if (!me.btnRedo.isDisabled()) {
                        me.onRedo();
                        e.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', me.keydownHandler, true);

            this.on('close', function(obj){
                me.api.asc_unregisterCallback('asc_onSignatureImageLoaded', onApiImgLoaded);
                me.api.asc_unregisterCallback('asc_CanUndoSignature', onCanUndoChanged);
                me.api.asc_unregisterCallback('asc_CanRedoSignature', onCanRedoChanged);
                Common.NotificationCenter.off('storage:image-insert', insertImageFromStorage);
                document.removeEventListener('keydown', me.keydownHandler, true);
            });

            const $window = this.getChild();
            $window.find('.dlg-btn').on('click', e => {
                const result = e.currentTarget.getAttribute('result');
                me.saveSignature(result);
                if ( me.options.handler )
                    me.options.handler.call(me, result);
                me.close();
            });
        },

        saveSignature: function(result) {
            if (result === 'ok' && this.props) {
                const serialized = this.props.serialize();
                if (!serialized.signatureImage) return;
                serialized.mode = this.mode;
                var key = this.getKey();
                if (this.chSave.getValue() === 'checked') {
                    serialized['vectorImage'] = this.props.getVectorImage();
                    if (key) Common.localStorage.setItem(key, JSON.stringify(serialized));
                    Common.Views.PdfSavedSignatureMenu.addSavedSignature(serialized);
                } else if (key) {
                    Common.localStorage.removeItem(key);
                }
            }
        },

        updateThemeColors: function() {
            // this.colorsLine.updateColors(Common.Utils.ThemeColor.getEffectColors(), Common.Utils.ThemeColor.getStandartColors());
        },

        getSignatureId: function() {
            return (this.props && this.hasField) ? this.props.get_FormId() : '';
        },

        getKey: function() {
            var id = this.options.signatureId || this.getSignatureId();
            return id ? 'dialog-signature-' + id : null;
        },

        onImgModeClick: function(mode, btn) {
            this.mode = mode;
            this.ShowHideElem(mode);
        },

        ShowHideElem: function(mode) {
            this.imgUploadPnl.toggleClass('hidden', !!mode);
            this.imgDrawPnl.toggleClass('hidden', mode!==1);
            this.imgTypePnl.toggleClass('hidden', mode!==2);
            this.btnOk.setDisabled(!mode && !this.isImageLoaded);
            var me = this;
            _.delay(function(){
                me.props.updateView(mode);
                mode===1 ? me.cmbLineSize.focus() : mode===2 ? me.inputName.focus() : me.btnSelectImage.focus();
            },50);
        },

        onImageSelect: function(menu, item) {
            if (item.value==1) {
                var me = this;
                (new Common.Views.ImageFromUrlDialog({
                    handler: function(result, value) {
                        if (result == 'ok') {
                            var checkUrl = value.replace(/ /g, '');
                            if (!_.isEmpty(checkUrl)) {
                                me.props.put_ImageUrl(checkUrl);
                            }
                        }
                    }
                })).on('close', function() {
                }).show();
            } else if (item.value==2) {
                Common.NotificationCenter.trigger('storage:image-load', 'signature');
            } else {
                this.props.showFileDialog();
            }
        },

        onColorsLineSelect: function(btn, color) {
            Common.UI.Menu.Manager.hideAll();
            this.btnLineColor.setColor(color);
            this.props && this.props.put_LineColor(Common.Utils.ThemeColor.getRgbColor(color));
        },

        _setDefaults: function (props) {
            if (props) {
                props.put_PreviewImgId('pdf-sign-img-upload-preview');
                props.put_PreviewDrawId('pdf-sign-img-draw-preview');
                props.put_PreviewTypeId('pdf-sign-img-type-preview');
                this.btnUndo.setDisabled(!props.asc_canUndo());
                this.btnRedo.setDisabled(!props.asc_canRedo());
            }
        },

        getSettings: function () {

        },

        onBtnClick: function(event) {
            this._handleInput(event.currentTarget.attributes['result'].value);
        },

        onPrimary: function(event) {
            this._handleInput('ok');
            return false;
        },

        _handleInput: function(state) {
            if (this.options.handler) {
                if (state == 'ok' && this.btnOk.isDisabled()) {
                    return;
                }
                this.saveSignature(state);
                this.options.handler.call(this, state, this.getSettings());
            }

            this.close();
        },

        onClear: function () {
            switch (this.mode) {
                case 0:
                    this.props.clearImg();
                    this.isImageLoaded = false;
                    this.uploadEmptyPnl.toggleClass('hidden', false);
                    this.uploadPreviewPnl.toggleClass('hidden', true);
                    this.btnOk.setDisabled(true);
                    this.chRemBack.setValue('unchecked');
                    this.chRemBack.setDisabled(true);
                    break;
                case 1:
                    this.props.clearDraw();
                    break;
                case 2:
                    this.props.clearType();
                    this.inputName.setValue('');
                    break;
            }
        },

        onUndo: function () {
            this.props.undo();
        },

        onRedo: function () {
            this.props.redo();
        },

        onFontSizeChanged: function(before, combo, record, e) {
            var value;

            if (before) {
                var item = combo.store.findWhere({
                    displayValue: record.value
                });

                if (!item) {
                    value = /^\+?(\d*(\.|,)?\d+)$|^\+?(\d+(\.|,)?\d*)$/.exec(record.value);

                    if (!value) {
                        value = combo.getValue();
                        combo.setRawValue(value);
                        e.preventDefault();
                        return false;
                    }
                }
            } else {
                var maxvalue = 300;
                value = Common.Utils.String.parseFloat(record.value);
                value = value > maxvalue ? maxvalue :
                    value < 1 ? 1 : Math.floor((value+0.4)*2)/2;

                combo.setRawValue(value);
                this.font.size = value;
                this.props && this.props.put_TypeFontSize(value);
            }
        },

        onLineSizeChanged: function(combo, record, e) {
            const item = combo.store.findWhere({
                displayValue: record.value
            });

            if (!item) {
                const value = /^\+?(\d*(\.|,)?\d+)$|^\+?(\d+(\.|,)?\d*)$/.exec(record.value);

                if (!value) {
                    let value = combo.getValue();
                    combo.setRawValue(value + ' px');
                    e.preventDefault();
                    return false;
                }
            }
        },

        onChangeName: function (input, value) {
            this.props && this.props.setText(value);
        },

        txtTitle: 'Signature',
        txtUpload: 'Upload',
        txtDraw: 'Draw',
        txtType: 'Type',
        textLooksAs: 'Signature looks as',
        textClear: 'Clear',
        textSelect: 'Select Image',
        txtUploadDesc: 'You can upload images in JPEG, JPG, GIF and PNG formats with a max size of 30 Mb',
        textBefore: 'Before signing this document, verify that the content you are signing is correct',
        txtRemBack: 'Remove white background',
        textFromUrl: 'From URL',
        textFromFile: 'From File',
        textFromStorage: 'From Storage',
        tipUndo: 'Undo',
        tipRedo: 'Redo',
        textBold: 'Bold',
        textItalic: 'Italic',
        txtSaveSignature: 'Save signature'

    }, Common.Views.PdfSignDialog || {}))
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
/**
 *  PdfSavedSignatureMenu.js
 *
 *  Created on 15/06/26
 *
 */

define('common/main/lib/view/PdfSavedSignatureMenu',[], function () { 'use strict';
    Common.Views.PdfSavedSignatureMenu = _.extend({

        getSavedSignature: function() {
            var storedJson = Common.localStorage.getItem('dialog-signature-saved');
            if (!storedJson) return [];

            var data = JSON.parse(storedJson);
            return _.isArray(data) ? data : [];
        },

        addSavedSignature: function(data) {
            if (!data || !data.signatureImage) return;

            var signatures = this.getSavedSignature();
            signatures = _.filter(signatures, function(signature) {
                return signature.signatureImage !== data.signatureImage;
            });
            signatures.unshift(data);
            signatures = signatures.slice(0, 3);
            Common.localStorage.setItem('dialog-signature-saved', JSON.stringify(signatures));
        },

        getCurrentSignature: function(id) {
            var storedJson = id ? Common.localStorage.getItem('dialog-signature-' + id) : null;

            if (!storedJson) return null;

            var data = JSON.parse(storedJson);
            return data && data.signatureImage ? data : null;
        },

        isSelectedSignature: function(data, currentSignature) {
            return !!(data && currentSignature && data.signatureImage === currentSignature.signatureImage);
        },

        removeSavedSignature: function(data) {
            if (!data || !data.signatureImage) return;

            var signatures = this.getSavedSignature();
            signatures = _.filter(signatures, function(signature) {
                return signature.signatureImage !== data.signatureImage;
            });

            if (signatures.length) Common.localStorage.setItem('dialog-signature-saved', JSON.stringify(signatures));
            else Common.localStorage.removeItem('dialog-signature-saved');
        },

        getMenuContainer: function(rootEl, menu) {
            return menu ? rootEl.find(Common.Utils.String.format('#menu-container-{0}', menu.id)) : null;
        },

        createMenuContainer: function(rootEl, menu) {
            var menuContainer = this.getMenuContainer(rootEl, menu);
            if (!menuContainer || menuContainer.length < 1) {
                menuContainer = $(Common.Utils.String.format(
                    '<div id="menu-container-{0}" style="position: absolute; z-index: 10000;"><div class="dropdown-toggle" data-toggle="dropdown"></div></div>',
                    menu.id
                ));
                rootEl.append(menuContainer);
            }
            return menuContainer;
        },

        hideMenu: function(rootEl, menu) {
            var menuContainer = this.getMenuContainer(rootEl, menu);
            if (menu) menu.hide();
            menuContainer && menuContainer.hide();
        },

        syncMenu: function(menu, storedSignature, currentSignature) {
            var me = this,
                index = 0;

            _.each(menu.items, function(item) {
                if (item.value !== 'saved') return;

                var signature = storedSignature[index++];
                item.options.signatureData = signature || null;
                item.options.signatureImage = signature ? signature.signatureImage : '';

                if (!item.cmpEl) return;

                if (signature) item.cmpEl.show();
                else item.cmpEl.hide();

                item.cmpEl.find('img').attr('src', item.options.signatureImage);
                item.cmpEl.find('.pdf-saved-signature-preview').toggleClass(
                    'pdf-saved-signature-selected',
                    me.isSelectedSignature(signature, currentSignature)
                );
            });
        },

        getMenuItems: function(options) {
            options = options || {};
            var items = [];

            for (var i = 0; i < 3; i++) {
                items.push({
                    cls: 'pdf-saved-signature-menu-item',
                    value: 'saved',
                    signatureData: null,
                    signatureImage: '',
                    deleteCaption: this.txtDeleteSavedSignature,
                    template: _.template([
                        '<a id="<%= id %>" class="menu-item pdf-saved-signature-item" data-no-icon tabindex="-1" type="menuitem">',
                            '<div class="pdf-saved-signature-preview">',
                                '<img class="pdf-saved-signature-img" src="<%- options.signatureImage %>">',
                            '</div>',
                        '</a>',
                        '<span class="signature-delete pdf-saved-signature-delete" role="button" tabindex="-1" data-toggle="tooltip" aria-label="<%- options.deleteCaption %>"></span>'
                    ].join(''))
                });
            }
            items.push({
                caption: this.txtCreateNewSignature,
                value: 'new',
                template: _.template([
                    '<a id="<%= id %>" class="menu-item signature-create-new pdf-saved-signature-create" data-no-icon tabindex="-1" type="menuitem">',
                        '<span class="pdf-saved-signature-create-icon"></span><%- caption %>',
                    '</a>'
                ].join(''))
            });

            if (options.onClearField) {
                items.push({
                    caption: this.txtClearSignatureField,
                    value: 'clear',
                    template: _.template([
                        '<a id="<%= id %>" class="menu-item pdf-saved-signature-clear" data-no-icon tabindex="-1" type="menuitem">',
                            '<%- caption %>',
                        '</a>'
                    ].join(''))
                });
            }

            return items;
        },

        bindMenuEvents: function(menu, options) {
            var me = this;

            menu.on('item:click', function(menu, item, e) {
                e && e.stopImmediatePropagation();

                if (item.value === 'saved' && item.options.signatureData) {
                    options.onApply && options.onApply(item.options.signatureData, menu);
                } else if (item.value === 'new') {
                    options.onCreateNew && options.onCreateNew(menu);
                } else if (item.value === 'clear') {
                    options.onClearField && options.onClearField(menu);
                }
            });

            _.each(menu.items, function(item) {
                if (item.value !== 'saved')
                    return;

                var deleteButton = item.cmpEl.find('.signature-delete');
                deleteButton.tooltip({ title: me.txtDeleteSavedSignature, placement: 'cursor', zIndex: 10001});
                deleteButton.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();

                    deleteButton.tooltip('hide');
                    options.onDelete && options.onDelete(item.options.signatureData, menu);
                });
            });
            menu.on('hide:after', function() {
                _.each(menu.items, function(item) {
                    if (item.value === 'saved')
                        item.cmpEl.find('.signature-delete').tooltip('hide');
                });
                options.onHideAfter && options.onHideAfter(menu);
            });
        },

        createMenu: function(rootEl, options) {
            var menu = new Common.UI.Menu({
                menuAlign: 'tl-bl',
                style: 'width: 200px;',
                items: this.getMenuItems(options)
            });
            var menuContainer = this.createMenuContainer(rootEl, menu);

            menu.render(menuContainer);
            menu.cmpEl.attr({tabindex: "-1"});

            this.bindMenuEvents(menu, options);

            this.syncMenu(menu, options.storedSignature, options.currentSignature);

            return {
                menu: menu,
                menuContainer: menuContainer
            };
        },

        getFieldRect: function(scope, signProps) {
            return signProps ? scope.api.asc_GetContentControlBoundingRect(signProps.get_FormId()) : null;
        },

        showMenu: function(rootEl, menuContainer, menu, fieldBounds) {
            var bounds = Common.Utils.getBoundingClientRect(rootEl.get(0)),
                height = bounds.height,
                bottom = bounds.bottom,
                menuOffset = 4,
                menuTolerance = 8,
                x = fieldBounds[0],
                y = fieldBounds[3],
                left = bounds.left + x,
                top = bounds.top + y;

            if (height && (fieldBounds[3] <= 0 || fieldBounds[1] >= height)) {
                menu.hide();
                menuContainer.attr('data-value', '').hide();
                return false;
            }

            menu.menuAlign = 'tl-bl';
            menuContainer.css({left: x, top : y}).show();
            menu.show();
            var menuHeight = menu.cmpEl.outerHeight(),
                menuWidth = menu.cmpEl.outerWidth();

            if (top + menuHeight > bottom + menuTolerance) {
                top = bounds.top + fieldBounds[1] - menuOffset - menuHeight;
                if (top >= bounds.top) {
                    menu.menuAlign = 'bl-tl';
                } else {
                    menu.hide();
                    menuContainer.attr('data-value', '').hide();
                    return false;
                }
            }

            if (left + menuWidth > bounds.right) left = bounds.right - menuWidth;
            if (left < bounds.left) left = bounds.left;

            menu.cmpEl.css({left: left, top: top});

            _.delay(function() {
                menu.cmpEl.focus();
            }, 10);
            return true;
        },

        updateMenuPosition: function(scope, rootEl, rect) {
            var menu = scope.signatureControlMenu;
            if (!menu || (!menu.isVisible() && !scope.menuHidden)) return;

            if (!rect) {
                this.hideMenu(rootEl, menu);
                scope.menuHidden = true;
                return;
            }

            var menuContainer = this.getMenuContainer(rootEl, menu),
                menuShown = this.showMenu(rootEl, menuContainer, menu, rect);
            scope.menuHidden = !menuShown;
        },

        updateFormPosition: function(scope, rootEl) {
            this.updateMenuPosition(scope, rootEl, this.getFieldRect(scope, scope.currentSignatureProps));
        },

        showActions: function(scope, options) {
            options = options || {};

            var rootEl = options.rootEl,
                rect = options.rect,
                target = options.target,
                storedSignature = this.getSavedSignature(),
                currentSignature = this.getCurrentSignature(options.currentId),
                menu = scope.signatureControlMenu,
                me = this,
                uncheck = function() {
                    scope.api.asc_UncheckContentControlButtons();
                },
                closeMenu = function(currentMenu) {
                    scope.menuHidden = false;
                    me.hideMenu(rootEl, currentMenu);
                    uncheck();
                };

            if (!storedSignature.length) {
                options.openDialog && options.openDialog.call(scope, target);
                return;
            }

            scope.currentSignatureProps = target;
            scope._fromShowContentControls = true;
            Common.UI.Menu.Manager.hideAll();

            if (!menu) {
                menu = this.createMenu(rootEl, {
                    storedSignature: storedSignature,
                    currentSignature: currentSignature,
                    onApply: function(data, menu) {
                        options.applySignature && options.applySignature.call(scope, scope.currentSignatureProps, data);
                        closeMenu(menu);
                    },
                    onDelete: function(data, menu) {
                        me.removeSavedSignature(data);
                        closeMenu(menu);
                    },
                    onCreateNew: function(menu) {
                        closeMenu(menu);
                        _.defer(function() {
                            options.openDialog && options.openDialog.call(scope, scope.currentSignatureProps);
                        });
                    },
                    onClearField: options.clearField ? function(menu) {
                        options.clearField.call(scope, scope.currentSignatureProps);
                        closeMenu(menu);
                    } : null,
                    onHideAfter: function() {
                        if (!scope._fromShowContentControls)
                            uncheck();
                    }
                }).menu;
                scope.signatureControlMenu = menu;
            } else {
                this.syncMenu(menu, storedSignature, currentSignature);
            }

            var menuContainer = this.getMenuContainer(rootEl, menu),
                menuShown;
            menuContainer.attr('data-value', 'prevent-canvas-click');
            scope._preventClick = true;
            menuShown = rect ? this.showMenu(rootEl, menuContainer, menu, rect) : false;
            scope.menuHidden = !menuShown;
            scope._fromShowContentControls = false;
        },

        showFormField: function(scope, obj, options) {
            var signProps = obj.asc_getSignatureProps(scope.api);

            options = options || {};
            options.rect = this.getFieldRect(scope, signProps);
            options.currentId = signProps ? signProps.get_FormId() : '';
            options.target = signProps;
            this.showActions(scope, options);
        },

        showPdfField: function(scope, rect, fieldId, options) {
            options = options || {};
            options.rect = rect;
            options.currentId = fieldId;
            options.target = fieldId;
            this.showActions(scope, options);
        },

        txtDeleteSavedSignature: 'Delete saved signature',
        txtCreateNewSignature: 'Create a new signature',
        txtClearSignatureField: 'Clear signature field'
    }, Common.Views.PdfSavedSignatureMenu || {});
});
/*
 * Copyright (C) Ascensio System SIA, 2009-2026
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation, together with the
 * additional terms provided in the LICENSE file.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. For
 * details, see the GNU AGPL at: https://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA by email at info@onlyoffice.com
 * or by postal mail at 20A-6 Ernesta Birznieka-Upisha Street, Riga,
 * LV-1050, Latvia, European Union.
 *
 * The interactive user interfaces in modified versions of the Program
 * are required to display Appropriate Legal Notices in accordance with
 * Section 5 of the GNU AGPL version 3.
 *
 * No trademark rights are granted under this License.
 *
 * All non-code elements of the Product, including illustrations,
 * icon sets, and technical writing content, are licensed under the
 * Creative Commons Attribution-ShareAlike 4.0 International License:
 * https://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 * This license applies only to such non-code elements and does not
 * modify or replace the licensing terms applicable to the Program's
 * source code, which remains licensed under the GNU Affero General
 * Public License v3.
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

require([
    'common/main/lib/component/TextareaField',
    'common/main/lib/view/PluginDlg',
    'common/main/lib/view/CopyWarningDialog',
    'common/main/lib/view/TextInputDialog',
    'common/main/lib/view/SelectFileDlg',
    'common/main/lib/view/SaveAsDlg',
    'common/main/lib/view/SignDialog',
    'common/main/lib/view/SignSettingsDialog',
    'common/main/lib/view/PdfSignDialog',
    'common/main/lib/view/PdfSavedSignatureMenu'
], function () {
    Common.NotificationCenter.trigger('app-pack:loaded');
});

define("../apps/documenteditor/forms/app_pack.js", function(){});

