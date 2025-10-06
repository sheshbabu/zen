function createTransformerManager(stage, layer, nodesRef, onTransformEnd) {
  let transformer = null;

  function initialize() {
    transformer = new window.Konva.Transformer({
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right'],
      rotateEnabled: false,
      borderStroke: '#3B82F6',
      borderStrokeWidth: 2,
      anchorFill: '#3B82F6',
      anchorStroke: '#FFFFFF',
      anchorSize: 10,
      anchorCornerRadius: 2,
      anchorStrokeWidth: 2,
      padding: 5,
      boundBoxFunc: function (oldBox, newBox) {
        if (newBox.width < 300) {
          return oldBox;
        }
        if (newBox.height < 200) {
          return oldBox;
        }
        if (newBox.width > 1000) {
          return oldBox;
        }
        if (newBox.height > 1200) {
          return oldBox;
        }
        return newBox;
      }
    });

    layer.add(transformer);

    transformer.on('transformend', () => {
      if (onTransformEnd) {
        onTransformEnd();
      }
    });
  }

  function attachToNodes(nodes) {
    if (transformer === null) {
      return;
    }

    if (nodes.length === 0) {
      transformer.nodes([]);
      layer.draw();
      return;
    }

    transformer.nodes(nodes);

    if (nodes.length === 1) {
      const node = nodes[0];
      const nodeData = nodesRef.current.find(n => n.group === node);

      if (nodeData && nodeData.type === 'image') {
        transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
        transformer.keepRatio(true);
        transformer.boundBoxFunc(function (oldBox, newBox) {
          if (newBox.width < 300 || newBox.height < 200 || newBox.width > 1000 || newBox.height > 1200) {
            return oldBox;
          }
          return newBox;
        });
      } else if (nodeData && nodeData.type === 'sticky') {
        transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']);
        transformer.keepRatio(false);
        transformer.boundBoxFunc(function (oldBox, newBox) {
          if (newBox.width < 50 || newBox.height < 50) {
            return oldBox;
          }
          return newBox;
        });
      } else {
        transformer.enabledAnchors(['middle-left', 'middle-right', 'top-center', 'bottom-center']);
        transformer.keepRatio(false);
        transformer.boundBoxFunc(function (oldBox, newBox) {
          if (newBox.width < 300 || newBox.height < 200 || newBox.width > 1000 || newBox.height > 1200) {
            return oldBox;
          }
          return newBox;
        });
      }
    } else {
      transformer.enabledAnchors(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']);
      transformer.keepRatio(false);
      transformer.boundBoxFunc(function (oldBox, newBox) {
        if (newBox.width < 300 || newBox.height < 200 || newBox.width > 1000 || newBox.height > 1200) {
          return oldBox;
        }
        return newBox;
      });
    }

    transformer.moveToTop();
    layer.draw();
  }

  function detach() {
    if (transformer === null) {
      return;
    }

    transformer.nodes([]);
    layer.draw();
  }

  function destroy() {
    if (transformer) {
      transformer.destroy();
      transformer = null;
    }
  }

  return {
    initialize,
    attachToNodes,
    detach,
    destroy
  };
}

export default { createTransformerManager };
