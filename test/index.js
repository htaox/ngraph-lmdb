describe('Setup graph', function() {

  var fs = require('fs'),
    lmdbConfig = require('../lib/lmdb-config');

  if (!fs.existsSync(lmdbConfig.env.path)) {
    fs.mkdirSync(lmdbConfig.env.path, 0777);
  }

  var graph = require('../index')();
  graph.clear();

  describe('Add 10 nodes & 10 links per node', function() {

    before(function(done) {

      var count = 10;
      for (var i = 0; i < count; i++) {
        graph.addNode(i + '', {
          title: (i % 2 == 0 ? 'Even better' : 'Odd better')
        });
        for (var j = 0; j < 10; j++) {
          var n = Math.floor((Math.random() * count));
          var label = j % 2 == 0 ? 'likes' : 'studies';
          label = j % 3 == 0 ? 'knows' : label;
          graph.addLink(i + '', n + '', label);
        }
      }
      done();
    });

    describe('Count nodes', function() {
      it('should be 10', function(done) {
        var nodesCount = graph.getNodesCount();
        nodesCount.should.be.exactly(10);
        done();
      });
    });

    describe('Count links', function() {
      it('should be 100', function(done) {
        var linksCount = graph.getLinksCount();
        linksCount.should.be.exactly(100);
        done();
      });
    });

  });

});


describe('Setup shremlin', function() {

  var graph = require('../index')();
  var shremlin = require('../lib/lmdb-shremlin-wrap');
  var g = shremlin(graph);

  describe('Get all vertices', function() {
    it('should get back 10 objects', function(done) {
      var count = 0;
      g.V().forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object;
        count++;
      });
      count.should.be.exactly(10);
      done();
    });
  });

  describe('Get one node by key value', function() {
    it('should get an object with id == 0 and data object with key named "title"', function(
      done) {
      g.V('0').forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object.and.containEql({
          id: '0'
        }).and.have.ownProperty('data').and.have.ownProperty('title');
      });
      done();
    });
  });

  describe('Get all nodes with title containing "even"', function() {
    it('should get 5 objects with title == "even"', function(done) {
      var count = 0;
      g.V({
        title: 'even'
      }).forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object.and.have.ownProperty('data').and.have.ownProperty('title').and
          .match(/even/i);
        count++;
      });
      count.should.be.exactly(5);
      done();
    });
  });

  describe('Get all nodes with title containing "odd"', function() {
    it('should get 5 objects with title == "odd"', function(done) {
      var count = 0;
      g.V({
        title: 'odd'
      }).forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object.and.have.ownProperty('data').and.have.ownProperty('title').and
          .match(/odd/i);
        count++;
      });
      count.should.be.exactly(5);
      done();
    });
  });

  describe('Get all out edges labeled "knows" for one node', function() {
    it('should get 4 objects with label == "knows"', function(done) {
      var count = 0;
      g.V('0').outE('knows').forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object.and.have.ownProperty('label').and.match(/knows/);
        count++;
      });
      count.should.be.exactly(4);
      done();
    });
  });

  describe('Get all in edges labeled "studies" for one node', function() {
    it('should get 3 objects with label == "knows"', function(done) {
      var count = 0;
      g.V('1').outE('studies').forEach(function(err, d, index, cursor, txn) {
        if (err) {
          return done(err);
        }
        if (!d) {
          return done('Item is undefined or null');
        }
        d.should.be.an.Object.and.have.ownProperty('label').and.match(/studies/);
        count++;
      });
      count.should.be.exactly(3);
      done();
    });
  });

});

describe('Test path', function() {

  var graph = require('../index')();
  var shremlin = require('../lib/lmdb-shremlin-wrap');
  var g = shremlin(graph);

  describe(
    'Get all paths with out edge labeled "studies" and then get the head (in) node for one node',
    function() {

      it('should get 3 sets of arrays.', function(done) {
        var count = 0;
        g.V('2').outE('studies').inV().path().forEach(function(err, d, index, cursor, txn) {
          if (err) {
            return done(err);
          }
          if (!d) {
            return done('Item is undefined or null');
          }

          describe('Each item of the array is also an array with exactly 3 items', function() {

            it('should be an Array and have length == 3', function() {
              d.should.be.an.Array.have.lengthOf(3);
            });
          });

          describe('Inspect each item #' + (count + 1) + ' of the path', function() {

            it(
              'should contain itself as first item, contain an edge with label "studies" as second item, and an object for the third item',
              function(done) {

                d.should.match({
                  '0': function(it) {
                    it.should.be.an.Object.and.have.ownProperty('id').and.eql('2');
                  },
                  '1': function(it) {
                    it.should.be.an.Object.and.have.properties(['fromId', 'toId']).and.have
                      .ownProperty('label').and.match(/studies/);
                  },
                  '2': function(it) {
                    it.should.be.an.Object.and.have.ownProperty('id');
                  }
                });

                done();
              });

          });

          count++;

        });

        count.should.be.exactly(3);
        done();

      });

    });

});
