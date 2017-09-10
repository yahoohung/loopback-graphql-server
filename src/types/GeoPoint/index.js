const loopback = require('loopback');

module.exports = {
  GeoPoint: {
    name: 'GeoPoint',
    generated: false,
    meta: {
      category: 'TYPE',
      fields: {
        lat: {
          generated: false,
          meta: {
            scalar: true,
            type: 'Float',
          },
          resolve: obj => obj.lat
        },
        lng: {
          generated: false,
          meta: {
            scalar: true,
            type: 'Float',
          },
          resolve: obj => obj.lng
        },
        distanceTo: {
          generated: false,
          meta: {
            scalar: true,
            type: 'Float',
            args: {
              point: {
                generated: false,
                required: true,
                type: 'GeoPointInput'
              },
              options: {
                generated: false,
                type: 'JSON'
              }
            }
          },
          resolve: (obj, { point, options }) => {
            const here = new loopback.GeoPoint(obj);
            const there = new loopback.GeoPoint(point);

            return loopback.GeoPoint.distanceBetween(here, there, options);
          }
        },
      }
    }
  },
  GeoPointInput: {
    name: 'GeoPointInput',
    generated: false,
    meta: {
      category: 'TYPE',
      input: true,
      fields: {
        lat: {
          generated: false,
          meta: {
            scalar: true,
            required: true,
            type: 'Float',
          }
        },
        lng: {
          generated: false,
          meta: {
            scalar: true,
            required: true,
            type: 'Float',
          }
        }
      }
    }
  }
};
