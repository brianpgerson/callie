import R from 'ramda';

export const getEventFromSettings = R.path(['settings', 'event']);

export const hasDateAndEvent = R.pipe(
  R.propOr([], ['settings']),
  R.both(R.has('date'), R.has('event')),
);

export const isSuccessful = (result) => {
  return result && result.success;
}

export const mapIndexed = R.addIndex(R.map);

export const pickRandom = (options) => R.unless(
  R.either(R.isNil, R.isEmpty),
  R.pipe(
    R.prop('length'),
    R.multiply(Math.random()),
    Math.floor,
    idx => R.nth(idx, options)
  )
)(options)

export const toRegex = (string) => new RegExp(string);
