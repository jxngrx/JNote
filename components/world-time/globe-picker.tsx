'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import * as am5 from '@amcharts/amcharts5';
import * as am5map from '@amcharts/amcharts5/map';
import am5geodata_worldLow from '@amcharts/amcharts5-geodata/worldLow';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

export type GlobeCountrySelection = {
  id: string;
  name: string;
};

type GlobePickerProps = {
  active?: boolean;
  selectedCountryId?: string | null;
  onCountrySelect: (country: GlobeCountrySelection) => void;
  className?: string;
};

function createGlobeTheme(root: am5.Root) {
  const theme = am5.Theme.new(root);
  theme.rule('InterfaceColors').setAll({
    primaryButton: am5.color(0xf0ede8),
    primaryButtonHover: am5.color(0xffffff),
    alternativeBackground: am5.color(0x242422),
    background: am5.color(0x1c1c1a),
    stroke: am5.color(0x5a5855),
  });
  return theme;
}

export function GlobePicker({
  active = true,
  selectedCountryId,
  onCountrySelect,
  className,
}: GlobePickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartRef = useRef<am5map.MapChart | null>(null);
  const polygonSeriesRef = useRef<am5map.MapPolygonSeries | null>(null);
  const onSelectRef = useRef(onCountrySelect);
  const previousPolygonRef = useRef<am5.Sprite | null>(null);

  onSelectRef.current = onCountrySelect;

  useEffect(() => {
    if (!active || !containerRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    const initChart = () => {
      const el = containerRef.current;
      if (disposed || !el || el.clientWidth < 10 || el.clientHeight < 10) {
        requestAnimationFrame(initChart);
        return;
      }

      const root = am5.Root.new(el);
      rootRef.current = root;
      root.setThemes([am5themes_Animated.new(root), createGlobeTheme(root)]);

      const chart = root.container.children.push(
        am5map.MapChart.new(root, {
          panX: 'rotateX',
          panY: 'rotateY',
          wheelY: 'zoom',
          projection: am5map.geoOrthographic(),
          minZoomLevel: 1,
          maxZoomLevel: 8,
          homeZoomLevel: 1,
          paddingTop: 4,
          paddingBottom: 4,
          paddingLeft: 4,
          paddingRight: 4,
        })
      );
      chartRef.current = chart;

      const graticuleSeries = chart.series.push(
        am5map.GraticuleSeries.new(root, { step: 15 })
      );
      graticuleSeries.mapLines.template.setAll({
        stroke: am5.color(0xf0ede8),
        strokeOpacity: 0.07,
      });

      const backgroundSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {})
      );
      backgroundSeries.mapPolygons.template.setAll({
        fill: am5.color(0x111110),
        fillOpacity: 1,
        strokeOpacity: 0,
      });
      backgroundSeries.data.push({
        geometry: am5map.getGeoRectangle(90, 180, -90, -180),
      });

      const polygonSeries = chart.series.push(
        am5map.MapPolygonSeries.new(root, {
          geoJSON: am5geodata_worldLow,
        })
      );
      polygonSeriesRef.current = polygonSeries;

      polygonSeries.mapPolygons.template.setAll({
        tooltipText: '{name}',
        toggleKey: 'active',
        interactive: true,
        fill: am5.color(0x5a5855),
        stroke: am5.color(0x8a8783),
        strokeWidth: 0.5,
      });

      polygonSeries.mapPolygons.template.states.create('hover', {
        fill: am5.color(0x8a8783),
        stroke: am5.color(0xf0ede8),
        strokeWidth: 0.8,
      });

      polygonSeries.mapPolygons.template.states.create('active', {
        fill: am5.color(0xc4c0b8),
        stroke: am5.color(0xf0ede8),
        strokeWidth: 1.2,
      });

      function rotateToPolygon(target: am5.Sprite) {
        const mapPolygon = target as unknown as {
          geoCentroid?: () => { longitude: number; latitude: number } | undefined;
        };
        const centroid = mapPolygon.geoCentroid?.();
        if (!centroid) return;
        chart.animate({
          key: 'rotationX',
          to: -centroid.longitude,
          duration: 1100,
          easing: am5.ease.inOut(am5.ease.cubic),
        });
        chart.animate({
          key: 'rotationY',
          to: -centroid.latitude,
          duration: 1100,
          easing: am5.ease.inOut(am5.ease.cubic),
        });
      }

      polygonSeries.mapPolygons.template.events.on('click', (ev) => {
        const dataItem = ev.target.dataItem;
        if (!dataItem) return;

        const ctx = dataItem.dataContext as { id?: string; name?: string };
        const id = ctx?.id ?? '';
        const name = ctx?.name ?? id;
        if (!id) return;

        if (previousPolygonRef.current && previousPolygonRef.current !== ev.target) {
          previousPolygonRef.current.set('active', false);
        }
        ev.target.set('active', true);
        previousPolygonRef.current = ev.target;

        rotateToPolygon(ev.target);
        onSelectRef.current({ id, name });
      });

      chart.appear(600, 100);
      root.resize();

      resizeObserver = new ResizeObserver(() => {
        if (!disposed && rootRef.current) {
          rootRef.current.resize();
        }
      });
      resizeObserver.observe(el);
    };

    requestAnimationFrame(initChart);

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
      }
      chartRef.current = null;
      polygonSeriesRef.current = null;
      previousPolygonRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    const series = polygonSeriesRef.current;
    if (!series || !selectedCountryId) return;

    if (previousPolygonRef.current) {
      previousPolygonRef.current.set('active', false);
      previousPolygonRef.current = null;
    }

    const dataItem = series.getDataItemById(selectedCountryId);
    if (!dataItem) return;

    const polygon = dataItem.get('mapPolygon') as am5.Sprite | undefined;
    if (polygon) {
      polygon.set('active', true);
      previousPolygonRef.current = polygon;
      const chart = chartRef.current;
      if (chart) {
        const mapPolygon = polygon as unknown as {
          geoCentroid?: () => { longitude: number; latitude: number } | undefined;
        };
        const centroid = mapPolygon.geoCentroid?.();
        if (centroid) {
          chart.set('rotationX', -centroid.longitude);
          chart.set('rotationY', -centroid.latitude);
        }
      }
    }
  }, [selectedCountryId]);

  const handleZoomIn = useCallback(() => {
    chartRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    chartRef.current?.zoomOut();
  }, []);

  return (
    <div className="wt-globe-stage">
      <div
        ref={containerRef}
        className={className}
        role="img"
        aria-label="Interactive 3D globe. Drag to rotate, click a country to select."
      />
      <div className="wt-globe-zoom" aria-label="Globe zoom">
        <button
          type="button"
          className="wt-globe-zoom-btn"
          onClick={handleZoomIn}
          aria-label="Zoom in"
        >
          <Plus size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          className="wt-globe-zoom-btn"
          onClick={handleZoomOut}
          aria-label="Zoom out"
        >
          <Minus size={14} strokeWidth={2} />
        </button>
      </div>
      <p className="wt-globe-attribution">
        Map by{' '}
        <a
          href="https://www.amcharts.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          amCharts
        </a>
      </p>
    </div>
  );
}
