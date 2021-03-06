/**
 * Created by Quentin André on 07/10/2016.
 */
import * as jQuery from "jquery";
import "jquery";
import './distributionbuilder.css';
import "bootstrap-webpack!./bootstrap.config.js";

var $j = jQuery.noConflict();
import MouseHold from './../dependencies/mousehold'

MouseHold($j);

interface InitConfigObject {
    minVal?: number
    maxVal?: number
    nBalls?: number
    nRows?: number
    nBuckets?: number
    onTouch?: Function
    onChange?: Function

}

interface LabelizeConfigObject {
    labels?: Array<number | string>
    prefix?: string
    suffix?: string
}

declare global {
    interface JQuery {
        mousehold(timestart: number, timeout: number, callback: Function): any;
    }
}

type ValidRenderOrder =
    "buttons-grid-labels"
    | "grid-labels-buttons"
    | "labels-grid-buttons"
    | "-buttons-grid"
    | "grid-buttons-labels"
    | "buttons-labels-grid";

type ValidButtonAction = "increment" | "decrement";

class DistributionBuilder {
    min: number;
    max: number;
    nBalls: number;
    nRows: number;
    nBuckets: number;
    remainingBalls: number;
    distribution: Array<number>;
    _$target: JQuery<HTMLElement>;
    onTouch: Function;
    onChange: Function;

    constructor(o: InitConfigObject) {
        let obj = o ? o : {};
        this.min = obj.hasOwnProperty('minVal') ? obj.minVal : 0;
        this.max = obj.hasOwnProperty('maxVal') ? obj.maxVal : 10;
        this.nBalls = obj.hasOwnProperty('nBalls') ? obj.nBalls : 10;
        this.nRows = obj.hasOwnProperty('nRows') ? obj.nRows : 10;
        this.nBuckets = obj.hasOwnProperty('nBuckets') ? obj.nBuckets : 10;
        this.onTouch = obj.hasOwnProperty('onTouch') ? obj.onTouch : () => {
        };
        this.onChange = obj.hasOwnProperty('onChange') ? obj.onChange : () => {
        };
        this.remainingBalls = this.nBalls;
        this.distribution = new Array(this.nBuckets).fill(0);
        this._$target = $j('<div></div>');
    }

    render(target: string, order: ValidRenderOrder, r: boolean): void {
        if (r) {
            console.warn("The 'resize' argument has been deprecated.");
        }
        if ((this._$target)) { // Has already been rendered
            this._$target.html('');
            this._$target.removeClass('distbuilder');
        }
        let $target = $j('#' + target); // Target Div of Grid
        let parts = {
            'grid': this._createGrid($target),
            'labels': this._createLabels($target),
            'buttons': this._createButtons($target)
        };
        let validOrder = new RegExp('(buttons-grid-labels)|(grid-labels-buttons)|(labels-grid-buttons)|(labels-buttons-grid)|(grid-buttons-labels)|(buttons-labels-grid)', 'g');
        this._$target = $target;
        $target.addClass('distbuilder');
        let o = order ? order : "grid-labels-buttons";
        if (!validOrder.test(o)) {
            throw ("The order '" + o + "' could not be understood. Make sure " +
                "that the order is any combination of 'labels', 'grid', and " +
                "'button, separated by '-'.")
        } else {
            let renderorder = o.split('-');
            renderorder.forEach((e: string) => $target.append(parts[e]))
        }
    }

    labelize(o: LabelizeConfigObject): void {
        let obj = o ? o : {};
        let values = [];
        if (obj.hasOwnProperty('labels')) {
            values = obj.labels
        } else {
            let step = (this.max - this.min) / this.nBuckets;
            values = Array.from({length: this.nBuckets}, (value, key) => this.min + key * step + step / 2);
        }
        let prefix = obj.hasOwnProperty('prefix') ? obj.prefix : '';
        let suffix = obj.hasOwnProperty('suffix') ? obj.suffix : '';
        let labels = values.map((v) => prefix + v + suffix);
        this._setLabels(labels)
    }

    isComplete(): boolean {
        return (this.remainingBalls == 0);
    }

    getRemainingBalls(): number {
        return this.remainingBalls;
    }

    getDistribution(): Array<number> {
        return this.distribution.slice();
    }

    setDistribution(dist: Array<number>): void {
        if (dist.length != this.nBuckets) {
            throw ("The length of the entered distribution does not match the number of buckets")
        }

        let sumVals = dist.reduce((a, b) => a+b);
        if (sumVals > this.nBalls) {
            throw ("The number of balls in the distribution exceeds the number of balls.")
        }

        let maxVal = dist.reduce((a, b) => a >= b ? a : b);
        if (maxVal > this.nRows) {
            throw ("The number of balls in one or several buckets is greater than the number of rows.")
        }
        dist.map(
            (i, j) => this._$target.find(".distrow > .col" + j).slice(this.nRows-i, this.nRows).map(
                (a, x) => $j(x).addClass("filled")
            )
        );
        this.distribution = dist;
        this.remainingBalls = this.remainingBalls - sumVals;
     }

    _setLabels(labels: Array<string>): void {
        labels.forEach((l, i) => {
            let label = this._$target.find('.label' + i);
            label.html(l);
        })
    }

    _actionCreator(action: ValidButtonAction): Function {
        if (action == 'increment') {
            return (bucket: number) => {
                return () => {
                    this.onTouch();
                    if ((this.distribution[bucket] < (this.nRows)) && (this.remainingBalls > 0)) {
                        let rowIndex = this.distribution[bucket];
                        this._$target.find(".row" + rowIndex + ">.col" + bucket).addClass("filled");
                        this.distribution[bucket]++;
                        this.remainingBalls--;
                        this.onChange()
                    }
                }
            }
        } else {
            return (bucket: number) => {
                return () => {
                    this.onTouch();
                    if (this.distribution[bucket] > 0) {
                        this.distribution[bucket]--;
                        let rowIndex = this.distribution[bucket];
                        this._$target.find(".row" + rowIndex + ">.col" + bucket).removeClass("filled");
                        this.remainingBalls++;
                        this.onChange();
                    }
                }
            }
        }
    }

    _createGrid($target: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let nRows = this.nRows;
        let nBuckets = this.nBuckets;
        let $grid = $j('<div>', {class: "grid"}); //Div holding the grid
        for (let row = 0; row < nRows; row++) { // Create as many rows as needed
            let rowIndex = (nRows - row - 1); // Row number 0 is the bottom-most row.
            let $lineDiv = $j('<div>', {class: "distrow row" + rowIndex});
            for (let col = 0; col < nBuckets; col++) { // Create as many cells as needed
                let $colDiv = $j("<div>", {"class": "cell " + "col" + col});
                let $ball = $j("<div>", {"class": "ball " + "col" + col});
                $colDiv.append($ball);
                $lineDiv.append($colDiv); // Add each cell to the row
            }
            $grid.append($lineDiv); // Add each row to the grid div
        }
        return $grid
    }

    _createButtons($target: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let incrementAction = this._actionCreator('increment'); //Currying functions
        let decrementAction = this._actionCreator('decrement'); //Currying functions
        let $lineDivButtons = $j("<div>", {class: "distrow"});
        let $buttons = $j('<div>', {class: "buttons"}); //Div holding the buttons
        for (let col = 0; col < this.nBuckets; col++) {
            let $divButtons = $j("<div>", {"class": "buttongroup"});
            let $addButton = $j('<a>', {class: "btn btn-default distbutton glyphicon glyphicon-plus"});
            let $removeButton = $j('<a>', {class: "btn btn-default distbutton glyphicon glyphicon-minus"});
            $divButtons.append($addButton
                .mousehold(200, 100, incrementAction(col))
                .click(incrementAction(col))
            );
            $divButtons.append($removeButton
                .mousehold(200, 100, decrementAction(col))
                .click(decrementAction(col))
            );
            $lineDivButtons.append($divButtons);
        }
        $buttons.append($lineDivButtons);
        return $buttons
    }

    _createLabels($target: JQuery<HTMLElement>): JQuery<HTMLElement> {
        let $labels = $j('<div>', {class: "labels"}); //Div holding the buttons
        let $lineDivLabels = $j("<div>", {"class": "distrow"});
        for (let col = 0; col < this.nBuckets; col++) {
            let $divLabel = $j("<div>", {"class": "label" + " label" + col});
            $lineDivLabels.append($divLabel);
        }
        $labels.append($lineDivLabels); // Add each row to the grid div
        return $labels
    }


}

export default DistributionBuilder;