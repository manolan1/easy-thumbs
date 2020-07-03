
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * 60;

module.exports = class TimeConverter {

    static convertTimeToReadable(time, secondsDps = 0) {
        const hours = Math.floor(time / SECONDS_PER_HOUR);
        const remainderForMinutes = time % SECONDS_PER_HOUR;
        const mins = Math.floor(remainderForMinutes / SECONDS_PER_MINUTE);
        const secs = parseFloat(remainderForMinutes % SECONDS_PER_MINUTE).toFixed(secondsDps);
        return TimeConverter.zeroPadNumber(hours)
            + ':' + TimeConverter.zeroPadNumber(mins)
            + ':' + TimeConverter.zeroPadNumber(secs);
    }

    static zeroPadNumber(input) {
        return (input <= 9 ? '0' : '') + input;
    }
}