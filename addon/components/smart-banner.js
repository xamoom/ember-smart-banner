/* global window, navigator */

import Ember from 'ember';
import layout from '../templates/components/smart-banner';
import getOwner from 'ember-getowner-polyfill';
import localStorage from '../utils/local-storage';
import bannerStorage from '../utils/banner-storage';

const {
  getItem,
} = localStorage;

const {
  computed,
} = Ember;

const {
  setTimeStamp,
} = bannerStorage;

export default Ember.Component.extend({
  layout,

  classNames: ['ember-smart-banner'],
  // http://discuss.emberjs.com/t/best-practices-accessing-app-config-from-addon-code/7006/16
  config: computed(function() {
    return getOwner(this).resolveRegistration('config:environment').emberSmartBanner;
  }),

  title: computed.or('titleIOS', 'titleAndroid', 'config.title'),
  description: computed.or('descriptionIOS', 'descriptionAndroid', 'config.description', 'bannerDefaults.description'),
  linkText: computed.or('linkTextIOS', 'linkTextAndroid', 'config.linkText', 'bannerDefaults.linkText'),
  iconUrl: computed.reads('config.iconUrl'),
  showBanner: computed.and('bannerOpen', 'supportsOS', 'afterCloseBool', 'afterVisitBool'), // Set showBanner to true to always show
  link: computed.or('appStoreLink', 'marketLink', 'config.link'),

  userAgent: computed(function() {
    return (navigator.userAgent || navigator.vendor || window.opera);
  }),

  supportsOS: computed.or('supportsIOS', 'supportAndroid'),
  supportsIOS: computed.and('iOS', 'appIdIOS'),
  supportAndroid: computed.and('android', 'appIdAndroid'),

  iOS: computed('userAgent', function() {
    const userAgent = this.get('userAgent');
    return (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) || userAgent.match(/iPod/i));
  }),

  android: computed('userAgent', function() {
    const userAgent = this.get('userAgent');
    return (userAgent.match(/Android/i));
  }),

  titleIOS: computed.and('iOS', 'config.titleIOS'),
  descriptionIOS: computed.and('iOS', 'config.descriptionIOS'),
  linkTextIOS: computed.and('iOS', 'config.linkTextIOS'),
  appStoreLanguage: computed.or('config.appStoreLanguage', 'bannerDefaults.appStoreLanguage'),
  appIdIOS: computed.or('config.appIdIOS', 'bannerDefaults.appIdIOS'),
  appStoreLink: computed(function() {
    return (
      this.get('iOS') && (
        this.get('config.appStoreLink') || (
          `${this.get('bannerDefaults.appStoreLinkBase')}/${this.get('appStoreLanguage')}` +
            `/app/id${this.get('appIdIOS')}`
        )
      )
    );
  }),

  titleAndroid: computed.and('android', 'config.titleAndroid'),
  descriptionAndroid: computed.and('android', 'config.descriptionAndroid'),
  linkTextAndroid: computed.and('android', 'config.linkTextAndroid'),
  appIdAndroid: computed.reads('reads.appIdAndroid'),
  marketLink: computed(function() {
    return (this.get('android') && (
      this.get('config.marketLink') || 'market://details?id=' + this.get('appIdAndroid'))
    );
  }),

  bannerDefaults: {
    appStoreLinkBase: 'https://itunes.apple.com',
    appStoreLanguage: 'en',
    addIdIOS: '123',
    marketLinkBase: 'market://details?id=',
    appIdAndroid: '123',
    description: 'Company Name, Inc.',
    linkText: 'View'
  },

  bannerClosed: false,
  bannerOpen: computed.not('bannerClosed'),

  actions: {
    openLink: function() {
      this.set('bannerClosed', true);
      setTimeStamp('lastDayVisited');
    },

    closeBanner: function() {
      this.set('bannerClosed', true);
      setTimeStamp('lastDayClosed');
    }
  },



  reminderAfterClose: computed.reads('config.reminderAfterClose'), // Number of days after user closes banner to wait to show banner again, 0 for always show
  reminderAfterVisit: computed.reads('config.reminderAfterVisit'), // Number of days after visit to wait to show banner again, 0 for always show

  afterCloseBool: computed('daysSinceClose', 'reminderAfterClose', function() {
    const reminder = this.get('reminderAfterClose');
    if (typeof reminder  === 'undefined' || reminder === true) {
      return true;
    }

    if (!reminder && getItem('lastDayClosed')) {
      return false;
    }

    return this.gteDependentKeys('daysSinceClose', 'reminderAfterClose');
  }),

  afterVisitBool: computed('daysSinceVisit', 'reminderAfterVisit', function() {
    const reminder = this.get('reminderAfterVisit');
    if (typeof reminder  === 'undefined' || reminder === true) {
      return true;
    }

    if (!reminder  && getItem('lastDayVisited')) {
      return false;
    }

    return this.gteDependentKeys('daysSinceVisit', 'reminderAfterVisit');
  }),

  gteDependentKeys(firstKey, secondKey) {
    return (this.get(firstKey) >= this.get(secondKey));
  },

  daysSinceClose: computed(function() {
    const timeSinceClosed = new Date() - Date.parse(getItem('lastDayClosed'));
    return Math.floor(timeSinceClosed / (24 * 60 * 60 * 1000)); // Convert ms to days
  }),

  daysSinceVisit: computed(function() {
    const timeSinceVisited = new Date() - Date.parse(getItem('lastDayVisited'));
    return Math.floor(timeSinceVisited / (24 * 60 * 60 * 1000)); // Convert ms to days
  }),

  //https://github.com/jasny/jquery.smartbanner/blob/master/jquery.smartbanner.js
});
