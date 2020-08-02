// MOST Web Framework Centroid for Deno Copyright (c) 2020,
// THEMOST LP All rights reserved BSD-3-Clause license
/**
 * @class
 */
export class TimeSpan {
    years?: number;
    months?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    /**
     *
     * @param {number} years
     * @param {number}  months
     * @param {number} days
     * @param {number=} hours
     * @param {number=} minutes
     * @param {number=} seconds
     */
    constructor(years:number, months:number, days:number, hours?:number, minutes?:number, seconds?:number) {
        this.years = years;
        this.months = months;
        this.days = days;
        this.hours = hours;
        this.minutes = minutes;
        this.seconds = seconds;
    }
    toString() {

    }
}
