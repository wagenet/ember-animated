import $ from 'jquery';
import { task } from 'ember-concurrency';
import Ember from 'ember';
import { rAF } from './concurrency-helpers';

export default Ember.Object.extend({
  init() {
    this._super(...arguments);
    this._setupMotionList();
  },

  // --- Begin Hooks you should Implement ---

  // If any other motions exist for this element, the first hook
  // called will be `interrupt`. Here you can inspect the other
  // running motions if you want and save any state on `this` in order
  // to influence your own animation, and you can call `cancel` on the
  // other animations, or you can call `cancel` on on yourself, in
  // case you discover the running motions are just fine.
  //
  // May return a Promise if you want to block. Your animate hook
  // will not run until it resolves.
  interrupt: task(function * (motions) {
    // Default implementation stops all other motions on this elemnt.
    motions.forEach(m => m.cancel());
    yield null;
  }),

  // Start your animation here. It should be a cancelable task if you
  // want to be able to interrupt it.
  animate: task(function * () {
    yield null;
  }),


  // --- Begin public methods you may call ---

  cancel() {
    this.get('_run').cancelAll();
  },

  run() {
    return this.get('_run').perform();
  },

  join() {
    return this.get('_run.last');
  },

  // --- Begin private methods ---

  _setupMotionList() {
    let $elt = $(this.sprite.element);
    let motionList = $elt.data('lfMotions');
    if (!motionList) {
      $elt.data('lfMotions', motionList = []);
    }
    motionList.unshift(this);
    this._motionList = motionList;
  },

  _run: task(function * (){
    try {
      let others = this._motionList.filter(m => m !== this);
      if (others.length > 0) {
        yield this.get('interrupt').perform(others);
      }
      yield this.get('animate').perform();
    } finally {
      let index = this._motionList.indexOf(this);
      this._motionList.splice(index, 1);
      if (this._motionList.length === 0) {
        $(this.sprite.element).data('lfMotions', null);
      }
    }
  })
}).reopenClass({
  create(sprite, opts={}) {
    return this._super({ sprite, opts });
  }
});
