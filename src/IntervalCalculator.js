
const SAFE_OFFSET = 1;

// Return an array of sample positions, in seconds
module.exports = class IntervalCalculator {
    /*
     * SAFE_OFFSET represents the minimum safe spacing in seconds for a sample to be
     * separated from the start. This is to avoid situations where the start is incomplete.
     * 
     * - First sample is taken at SAFE_OFFSET seconds from the start (i.e. from 0)
     * - Last sample is taken at the nearest whole second to the end, unless that is the end
     *   itself (length is an integer number of seconds), when it is offset by SAFE_OFFSET
     * - Each sample is at an integer number of seconds to assist with finding the right
     *   "spot" in a video player.
     * - Samples are not taken more frequently than SAFE_OFFSET. In the event that they would
     *   be, the number of samples is reduced, so sampleCount represents the maximum number.
     *   If the video is less than SAFE_OFFSET seconds long, no samples are produced.
     * 
     * When considering things on an "interval" rather than "sample" basis, note that there
     * is one fewer intervals than samples.
     * 
     * Note that the number of samples returned can be smaller than the number requested.
     */
    static calculateByCount(duration, sampleCount) {
        if (!duration || duration < SAFE_OFFSET) {
            return [];
        }

        let lastSample = Math.floor(duration);
        if (lastSample === duration) {
            lastSample = lastSample - SAFE_OFFSET;
        }

        let intervalCount = sampleCount - 1;
        let intervalSize = (lastSample - SAFE_OFFSET) / intervalCount;

        if (intervalSize < SAFE_OFFSET) {
            intervalSize = SAFE_OFFSET;
            intervalCount = Math.floor((lastSample - SAFE_OFFSET) / intervalSize);
        }

        let previousSample = SAFE_OFFSET;
        const samples = [previousSample];
        for (let i = 0; i < intervalCount; i++) {
            const nextSample = previousSample + intervalSize
            samples.push(Math.floor(nextSample));
            previousSample = nextSample;
        }

        return samples;
    }

    static calculateByInterval(duration, intervalSize) {
        if (!duration || duration < SAFE_OFFSET) {
            return [];
        }

        let lastSample = Math.floor(duration);
        if (lastSample === duration) {
            lastSample = lastSample - SAFE_OFFSET;
        }

        if (intervalSize < SAFE_OFFSET) {
            intervalSize = SAFE_OFFSET;
        }
        const intervalCount = Math.floor((lastSample - SAFE_OFFSET) / intervalSize);

        let previousSample = SAFE_OFFSET;
        const samples = [previousSample];
        for (let i = 0; i < intervalCount; i++) {
            const nextSample = previousSample + intervalSize
            samples.push(Math.floor(nextSample));
            previousSample = nextSample;
        }

        return samples;
    }

}
