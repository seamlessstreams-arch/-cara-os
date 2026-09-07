// Shift the wall clock by CLOCK_SHIFT_DAYS for every process that loads this.
// Fixture literals stay put while every new Date()/Date.now() (and everything
// derived from them, e.g. seedDay's Monday anchor) moves — so a test that only
// passes on this week's calendar fails here, which is the point.
const days = Number(process.env.CLOCK_SHIFT_DAYS || 0);
if (days) {
  const OFFSET = days * 86400000;
  const RealDate = globalThis.Date;
  class ShiftedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(RealDate.now() + OFFSET);
      else super(...args);
    }
    static now() { return RealDate.now() + OFFSET; }
  }
  ShiftedDate.parse = RealDate.parse;
  ShiftedDate.UTC = RealDate.UTC;
  globalThis.Date = ShiftedDate;
}
