 ///<reference path="../../../headers/common.d.ts" />

import _ from 'lodash';
import $ from 'jquery';
import angular from 'angular';

import {
  QueryPartDef,
  QueryPart,
} from 'app/core/components/query_part/query_part';

var alertQueryDef = new QueryPartDef({
  type: 'query',
  params: [
    {name: "queryRefId", type: 'string', options: ['#A', '#B', '#C', '#D']},
    {name: "from", type: "string", options: ['1s', '10s', '1m', '5m', '10m', '15m', '1h']},
    {name: "to", type: "string", options: ['now']},
  ],
  defaultParams: ['#A', '5m', 'now', 'avg']
});

export class AlertTabCtrl {
  panel: any;
  panelCtrl: any;
  metricTargets;
  handlers = [{text: 'Grafana', value: 1}, {text: 'External', value: 0}];
  transforms = [
    {
      text: 'Aggregation',
      type: 'aggregation',
    },
    {
      text: 'Linear Forecast',
      type: 'forecast',
    },
  ];
  aggregators = ['avg', 'sum', 'min', 'max', 'last'];
  alert: any;
  thresholds: any;
  query: any;
  queryParams: any;
  transformDef: any;
  levelOpList = [
    {text: '>', value: '>'},
    {text: '<', value: '<'},
    {text: '=', value: '='},
  ];

  /** @ngInject */
  constructor($scope, private $timeout) {
    this.panelCtrl = $scope.ctrl;
    this.panel = this.panelCtrl.panel;
    $scope.ctrl = this;

    this.metricTargets = this.panel.targets.map(val => val);
    this.initModel();

    // set panel alert edit mode
    $scope.$on("$destroy", () => {
      this.panelCtrl.editingAlert = false;
      this.panelCtrl.render();
    });
  }

  getThresholdWithDefaults(thresholds, type, copyFrom) {
    var threshold = thresholds[type] || {};
    var defaultValue = (copyFrom[type] || {}).value || undefined;

    threshold.op = threshold.op || '>';
    threshold.value = threshold.value || defaultValue;
    return threshold;
  }

  initThresholdsOnlyMode() {
    if (!this.panel.thresholds) {
      return;
    }

    this.thresholds = this.panel.thresholds;

    // set threshold defaults
    this.thresholds.warn = this.getThresholdWithDefaults(this.thresholds, 'warn', {});
    this.thresholds.crit = this.getThresholdWithDefaults(this.thresholds, 'crit', {});

    this.panelCtrl.editingAlert = true;
    this.panelCtrl.render();
  }

  initModel() {
    var alert = this.alert = this.panel.alert = this.panel.alert || {};

    // set threshold defaults
    alert.thresholds = alert.thresholds || {};
    alert.thresholds.warn = this.getThresholdWithDefaults(alert.thresholds, 'warn', this.panel.thresholds);
    alert.thresholds.crit = this.getThresholdWithDefaults(alert.thresholds, 'crit', this.panel.thresholds);

    alert.frequency = alert.frequency || '60s';
    alert.handler = alert.handler || 1;
    alert.notifications = alert.notifications || [];

    alert.query = alert.query || {};
    alert.query.refId = alert.query.refId || 'A';
    alert.query.from = alert.query.from || '5m';
    alert.query.to = alert.query.to || 'now';

    alert.transform = alert.transform || {};
    alert.transform.type = alert.transform.type || 'aggregation';
    alert.transform.method = alert.transform.method || 'avg';

    var defaultName = this.panel.title + ' alert';
    alert.name = alert.name || defaultName;
    alert.description = alert.description || defaultName;

    // great temp working model
    this.queryParams = {
      params: [alert.query.refId, alert.query.from, alert.query.to]
    };

    // init the query part components model
    this.query = new QueryPart(this.queryParams, alertQueryDef);
    this.transformDef = _.findWhere(this.transforms, {type: alert.transform.type});

    this.panelCtrl.editingAlert = true;
    this.panelCtrl.render();
  }

  queryUpdated() {
    this.alert.query = {
      refId: this.query.params[0],
      from: this.query.params[1],
      to: this.query.params[2],
    };
  }

  transformChanged() {
    // clear model
    this.alert.transform = {type: this.alert.transform.type};
    this.transformDef = _.findWhere(this.transforms, {type: this.alert.transform.type});

    switch (this.alert.transform.type) {
      case 'aggregation':  {
        this.alert.transform.method = 'avg';
        break;
      }
      case "forecast": {
        this.alert.transform.timespan = '7d';
        break;
      }
    }
  }

  delete() {
    delete this.alert;
    delete this.panel.alert;
    // clear thresholds
    if (this.panel.thresholds) {
      this.panel.thresholds = {};
    }
    this.initModel();
  }

  enable() {
    if (this.thresholds) {
      delete this.thresholds;
      this.panelCtrl.
    }
    this.panel.alert = {};
    this.initModel();
  }

  thresholdsUpdated() {
    this.panelCtrl.render();
  }
}

/** @ngInject */
export function graphAlertEditor() {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: 'public/app/plugins/panel/graph/partials/tab_alerting.html',
    controller: AlertTabCtrl,
  };
}