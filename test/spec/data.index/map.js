// TODO (add tests) for:
// - IndexMap#copyDataFromSource
// - member should destroy only by internal calls

module.exports = {
  name: 'IndexMap',
  test: [
    {
      name: 'create',
      test: [
        {
          name: 'create with no source',
          test: function(){
            var map = new IndexMap({
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                sum: function(data, indexes){
                  return data.value + indexes.sum;
                },
                value: function(data){
                  return data.value;
                }
              }
            });

            assert(basis.object.keys(map.indexes).length === 1);
            assert(basis.object.keys(map.calcs).length === 2);
            assert(map.indexes.sum.value === 0);
            assert(map.itemCount === 0);
          }
        },
        {
          name: 'with source',
          test: function(){
            var calcCount = 0;
            var map = new IndexMap({
              source: Dataset.from(range(0, 2)),
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                sum: function(data, indexes){
                  calcCount++;
                  return data.value + indexes.sum;
                },
                value: function(data){
                  calcCount++;
                  return data.value;
                }
              }
            });

            assert(basis.object.keys(map.indexes).length === 1);
            assert(basis.object.keys(map.calcs).length === 2);
            assert(map.indexes.sum.value === 3);
            assert(calcCount === 2 * 3);
            assert(map.itemCount === 3);
            assert.deep(
              [
                { sum: 3 + 0, value: 0 },
                { sum: 3 + 1, value: 1 },
                { sum: 3 + 2, value: 2 }
              ],
              map.getValues('data')
            );
          }
        }
      ]
    },
    {
      name: 'changes',
      test: [
        {
          name: 'create w/o set/reset source',
          test: function(){
            var calcCount = 0;
            var map = new IndexMap({
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                sum: function(data, indexes){
                  calcCount++;
                  return data.value + indexes.sum;
                },
                value: function(data){
                  calcCount++;
                  return data.value;
                }
              }
            });

            var index = map.indexes.sum;

            // set source
            map.setSource(Dataset.from(range(0, 2)));
            assert(basis.object.keys(map.indexes).length === 1);
            assert(map.indexes.sum === index);
            assert(map.indexes.sum.value === 3);
            assert(calcCount === 3 * 2);
            assert(map.itemCount === 3);
            assert.deep(
              [
                { sum: 3 + 0, value: 0 },
                { sum: 3 + 1, value: 1 },
                { sum: 3 + 2, value: 2 }
              ],
              map.getValues('data')
            );

            // reset source
            map.setSource();
            assert(basis.object.keys(map.indexes).length === 1);
            assert(map.indexes.sum === index);
            assert(map.indexes.sum.value === 0);
            assert(calcCount === 3 * 2);
            assert(map.itemCount === 0);
            assert.deep([], map.getValues('data'));
          }
        },
        {
          name: 'change source',
          test: function(){
            var foo = Dataset.from(range(5, 10));
            var bar = Dataset.from(range(10, 14));

            var map = new IndexMap({
              calcs: {
                value: percentOfRange('update', 'data.value')
              }
            });

            map.setSource(foo);
            assert.deep(
              ['0.0', '0.2', '0.4', '0.6', '0.8', '1.0'],
              map.getValues('data.value.toFixed(1)')
            );

            map.setSource(bar);
            assert.deep(
              ['0.00', '0.25', '0.50', '0.75', '1.00'],
              map.getValues('data.value.toFixed(2)')
            );
          }
        },
        {
          name: 'create with source, change source items w/o index update',
          test: function(){
            var foo = Dataset.from(range(5, 9));

            var map = new IndexMap({
              source: foo,
              calcs: {
                value: percentOfRange('update', 'data.value')
              }
            });

            foo.add(range(6, 8));
            assert.deep(
              ['0.00', '0.25', '0.50', '0.75', '1.00', '0.25', '0.50', '0.75'],
              map.getValues('data.value.toFixed(2)')
            );

            this.async(function(){
              assert.deep(
                ['0.00', '0.25', '0.50', '0.75', '1.00', '0.25', '0.50', '0.75'],
                map.getValues('data.value.toFixed(2)')
              );
            });
          }
        },
        {
          name: 'create with source, change source items with index update',
          test: function(done){
            var foo = Dataset.from(range(5, 9));

            var map = new IndexMap({
              source: foo,
              calcs: {
                value: percentOfRange('update', 'data.value')
              }
            });

            assert.deep(
              ['0.000', '0.250', '0.500', '0.750', '1.000'],
              map.getValues('data.value.toFixed(3)')
            );

            foo.add(range(10, 13));
            assert.deep(
              ['0.000', '0.250', '0.500', '0.750', '1.000', '0.625', '0.750', '0.875', '1.000'],
              map.getValues('data.value.toFixed(3)')
            );

            setTimeout(function(){
              assert.deep(
                ['0.000', '0.125', '0.250', '0.375', '0.500', '0.625', '0.750', '0.875', '1.000'],
                map.getValues('data.value.toFixed(3)')
              );
              done();
            }, 20);
          }
        },
        {
          name: 'create w/o source, change source items w/o index update',
          test: function(){
            var foo = Dataset.from(range(5, 9));

            var map = new IndexMap({
              calcs: {
                value: percentOfRange('update', 'data.value')
              }
            });

            map.setSource(foo);
            assert.deep(
              ['0.000', '0.250', '0.500', '0.750', '1.000'],
              map.getValues('data.value.toFixed(3)')
            );

            foo.add(range(6, 8));
            assert.deep(
              ['0.00', '0.25', '0.50', '0.75', '1.00', '0.25', '0.50', '0.75'],
              map.getValues('data.value.toFixed(2)')
            );

            this.async(function(){
              assert.deep(
                ['0.00', '0.25', '0.50', '0.75', '1.00', '0.25', '0.50', '0.75'],
                map.getValues('data.value.toFixed(2)')
              );
            });
          }
        },
        {
          name: 'create w/o source, change source items with index update',
          test: function(done){
            var foo = Dataset.from(range(5, 9));

            var map = new IndexMap({
              calcs: {
                value: percentOfRange('update', 'data.value')
              }
            });

            map.setSource(foo);
            assert.deep(
              ['0.000', '0.250', '0.500', '0.750', '1.000'],
              map.getValues('data.value.toFixed(3)')
            );

            foo.add(range(10, 13));
            assert.deep(
              ['0.000', '0.250', '0.500', '0.750', '1.000', '0.625', '0.750', '0.875', '1.000'],
              map.getValues('data.value.toFixed(3)')
            );

            setTimeout(function(){
              assert.deep(
                ['0.000', '0.125', '0.250', '0.375', '0.500', '0.625', '0.750', '0.875', '1.000'],
                map.getValues('data.value.toFixed(3)')
              );
              done();
            }, 10);
          }
        }
      ]
    },
    {
      name: 'destroy',
      test: [
        {
          name: 'with source cleanup',
          test: function(){
            var indexCount = 0;
            var indexDestroyed = 0;
            var memberDestroyed = false;
            var destroyed = false;
            var map = new IndexMap({
              source: Dataset.from(range(0, 2)),
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                value: percentOfRange('update', 'data.value'),
                test: function(){
                  return 1;
                }
              },
              handler: {
                destroy: function(){
                  destroyed = true;
                }
              }
            });

            basis.object.iterate(map.indexes, function(name, index){
              indexCount++;
              index.addHandler({
                destroy: function(){
                  indexDestroyed++;
                }
              });
            });
            map.pick().addHandler({
              destroy: function(){
                memberDestroyed = true;
              }
            });

            // destroy
            map.destroy();

            assert(destroyed === true);
            assert(indexCount === 3);
            assert(indexDestroyed === indexCount);
            assert(memberDestroyed === true);
            assert(map.indexes === null);
            assert(map.calcs === null);
          }
        },
        {
          name: 'w/o source cleanup',
          test: function(){
            var indexCount = 0;
            var indexDestroyed = 0;
            var destroyed = false;
            var map = new IndexMap({
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                value: percentOfRange('update', 'data.value'),
                test: function(){
                  return 1;
                }
              },
              handler: {
                destroy: function(){
                  destroyed = true;
                }
              }
            });

            basis.object.iterate(map.indexes, function(name, index){
              indexCount++;
              index.addHandler({
                destroy: function(){
                  indexDestroyed++;
                }
              });
            });

            // destroy
            map.destroy();

            assert(destroyed === true);
            assert(indexCount === 3);
            assert(indexDestroyed === indexCount);
            assert(map.indexes === null);
            assert(map.calcs === null);
          }
        },
        {
          name: 'should destroy members on source object destroy',
          test: function(){
            var dataset = Dataset.from(range(0, 2));
            var destroyCount = 0;
            var indexDestroyed = false;
            var map = new IndexMap({
              source: dataset,
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                test: function(){
                  return 1;
                }
              }
            });

            map.forEach(function(item){
              item.addHandler({
                destroy: function(){
                  destroyCount++;
                }
              });
            });

            map.indexes.sum.addHandler({
              destroy: function(){
                indexDestroyed = true;
              }
            });

            // clear and destroy dataset items
            dataset.setAndDestroyRemoved();

            assert.deep({}, map.sourceMap_);
            assert(destroyCount === 3);
            assert(indexDestroyed === false);
          }
        },
        {
          name: 'should destroy members on source item removals',
          test: function(){
            var dataset = Dataset.from(range(0, 2));
            var destroyCount = 0;
            var indexDestroyed = false;
            var map = new IndexMap({
              source: dataset,
              indexes: {
                sum: sumIndex('data.value')
              },
              calcs: {
                test: function(){
                  return 1;
                }
              }
            });

            map.forEach(function(item){
              item.addHandler({
                destroy: function(){
                  destroyCount++;
                }
              });
            });

            map.indexes.sum.addHandler({
              destroy: function(){
                indexDestroyed = true;
              }
            });

            // clear dataset items
            dataset.clear();

            assert.deep({}, map.sourceMap_);
            assert(destroyCount === 3);
            assert(indexDestroyed === false);
          }
        }
      ]
    }
  ]
};
