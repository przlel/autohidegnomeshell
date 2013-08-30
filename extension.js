//
//  Copyright (c) 2011 Finnbarr P. Murphy.  All rights reserved.
//
//

const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Main = imports.ui.main;
const Tweener = imports.ui.tweener;
const PointerWatcher = imports.ui.pointerWatcher;
// change these to suit your own tastes and your system
const PANEL_HEIGHT = 25;
const AUTOHIDE_ANIMATION_TIME = 0.4;
const SHOW_TIME = 0.2;
const TIME_DELTA = 1500;
const MOUSE_POLL_FREQUENCY = 50;


function AutoHide() {
    this._init()
}
 
AutoHide.prototype = {
    _init: function() {
        this._buttonEvent = 0;
        this._leaveEvent = 0;
        this._enterEvent = 0;

        this._hidden = false;
        this._hidetime = 0;
        this._hideable = true;
    },

    _hidePanel: function() {
        let [xMouse, yMouse, mask] = global.get_pointer();
        if(yMouse <= PANEL_HEIGHT) return;
      //  if (Main.overview.visible /*|| this._hideable == false*/) return;

        Tweener.addTween(Main.panel.actor,
                     { height: 1,
                       time: AUTOHIDE_ANIMATION_TIME,
                       transition: 'easeOutQuad'
                     });

        let params = { y: 0,
                       time: AUTOHIDE_ANIMATION_TIME,
                       transition: 'easeOutQuad'
                     };

        Tweener.addTween(Main.panel._leftCorner.actor, params);
        Tweener.addTween(Main.panel._rightCorner.actor, params);

        params = { opacity: 0,
                   time: AUTOHIDE_ANIMATION_TIME - 0.1,
                   transition: 'easeOutQuad'
                 };

        Tweener.addTween(Main.panel._leftBox, params);
        Tweener.addTween(Main.panel._centerBox, params);
        Tweener.addTween(Main.panel._rightBox, params);

        this._hidden = true;
        this._stopTrackingMouse();
    },
    _startTrackingMouse: function() {
        if (!this._pointerWatch)
            this._pointerWatch = PointerWatcher.getPointerWatcher().addWatch(MOUSE_POLL_FREQUENCY, Lang.bind(this, this._hidePanel));
    },

    /**
     * stopTrackingMouse:
     * Turn off mouse tracking, if not already doing so.
     */
    _stopTrackingMouse: function() {
        if (this._pointerWatch)
            this._pointerWatch.remove();

        this._pointerWatch = null;
    },


    _showPanel: function(actor,event) {
        if (this._hidden == false) return;
        this._hidden = false;
        let params = { y: PANEL_HEIGHT - 1,
                       time: SHOW_TIME,
                       transition: 'easeOutQuad',
                       onComplete: this._hidePanel,
                     };
 
        Tweener.addTween(Main.panel._leftCorner.actor, params);
        Tweener.addTween(Main.panel._rightCorner.actor, params);

        Tweener.addTween(Main.panel.actor,
                     { height: PANEL_HEIGHT,
                       time: SHOW_TIME,
                       transition: 'easeOutQuad',
                       onComplete: this._hidePanel,
                     });

        params = { opacity: 255,
                   time: SHOW_TIME,
                   transition: 'easeOutQuad',
                    onComplete: this._hidePanel,
                 };

        Tweener.addTween(Main.panel._leftBox, params);
        Tweener.addTween(Main.panel._centerBox, params);
        Tweener.addTween(Main.panel._rightBox, params);
        this._startTrackingMouse();


        
    },

    _toggleChrome: function(bool) {
        let mlm = Main.layoutManager;
        mlm.removeChrome(mlm.panelBox);
        mlm.addChrome(mlm.panelBox, { affectsStruts: bool });
    },

    _toggleHideable: function(actor, event) {
        let ticks = event.get_time();
 
        if (this._hidetime == 0) {
            this._hidetime = ticks;
            return;
        }

        if ((ticks - this._hidetime) > TIME_DELTA) {
            this._hidetime = 0;
            return;
        }

        if (this._hideable == true) {
            this._hideable = false;
            this._toggleChrome(true);
        } else {
            this._hideable = true;
            this._toggleChrome(false);
        }

        this._hidetime = 0;
    },
 
    enable: function() {
        this._leaveEvent = Main.panel.actor.connect('leave-event', 
                                Lang.bind(Main.panel, this._hidePanel));
        this._enterEvent = Main.panel.actor.connect('enter-event', 
                                Lang.bind(Main.panel, this._showPanel));
  //     this._buttonEvent = Main.panel.actor.connect('button-release-event', 
   //                             Lang.bind(Main.panel, this._toggleHideable));
        this._toggleChrome(false);
        this._hideable = true;
        this._hidePanel();
    },
 
    disable: function() {
        if (this._buttonEvent) {
            Main.panel.actor.disconnect(this._buttonEvent);
            this._buttonEvent = 0;
        }
        if (this._leaveEvent) {
            Main.panel.actor.disconnect(this._leaveEvent);
            this._leaveEvent = 0;
        }
        if (this._enterEvent) {
            Main.panel.actor.disconnect(this._enterEvent);
            this._enterEvent = 0;
        }

        this._toggleChrome(true);
        this._hideable = true;
        this._showPanel();
    }

};
 
function init() {
    return new AutoHide();
}
