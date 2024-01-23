/* eslint-disable no-constant-condition */
// @ts-nocheck

import { useEffect, useRef, useState } from "react";
import "./App.css";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import type { Map } from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import Slider from "@mui/material/Slider";
import OpacityControl from "maplibre-gl-opacity";

function App() {
  const mapContainerRef = useRef(null);
  const map = useRef<Map>(new Map());
  const [activeLayer, setActiveLayer] = useState([]);
  const [drawState, setDrawState] = useState(null);
  const [bbox, setBbox] = useState(null);
  const [currentState, setCurrentState] = useState();
  const [value, setValue] = useState<number[]>([18, 20]);
  const [tileUrl, setTileUrl] = useState<string>(
    "https://janakpur.dmaps.org/api/v1/raster-tiles/{z}/{x}/{y}.png?raster_id=1"
  );

  const handleChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
  };
  useEffect(() => {
    if (!map.current) return;
    if (!mapContainerRef?.current) return;
    map.current = new maplibregl.Map({
      container: mapContainerRef.current, // container id
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap Contributors",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      // style: "https://demotiles.maplibre.org/style.json", // style URL
      center: [85.91866948778498, 26.720885910238067], // starting position [lng, lat]
      zoom: 16, // starting zoom
    });

    return () => {
      map.current?.remove();
    };
  }, [map]);

  const handleClick = (layerName: string) => {
    if (activeLayer.includes(layerName)) {
      setActiveLayer((prevStrings) =>
        prevStrings.filter((s) => s !== layerName)
      );
    } else {
      setActiveLayer((prevStrings) => [...prevStrings, layerName]);
    }
  };

  function removeRasterLayer(map, sourceName, layerId) {
    if (map.current.getSource(sourceName)) {
      map.current.removeSource(sourceName);
    }
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
  }
  function addRasterLayer(
    map,
    sourceName,
    tileUrl,
    layerId,
    boundingbox = [-180, -85.051129, 180, 85.051129]
  ) {
    if (map.current.getSource(sourceName)) {
      map.current.removeSource(sourceName);
    }
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
    }
    map.current.addSource(sourceName, {
      type: "raster",
      tiles: [tileUrl],
      tileSize: 256,
      scheme: "xyz",
      minzoom: 10,
      maxzoom: 20,
      bounds: boundingbox,
      attribution:
        'Map tiles by <a target="_blank" href="http://naxa.com.np">Naxa</a>; Hosting by <a href="https://naxa.com.np/" target="_blank">Naxa</a>. Data &copy; <a href="https://www.openstreetmap.org/about" target="_blank">OpenStreetMap</a> contributors',
    });

    map.current.addLayer({
      id: layerId,
      type: "raster",
      source: sourceName,
    });
  }

  function splitPolygon(Draw) {
    const features = Draw?.getAll();
    console.log(features, "features");

    if (features.features.length > 0) {
      const originalPolygon = features.features[0];
      const bbox = turf.bbox(originalPolygon);
      console.log(bbox, "bbox");
      setBbox(bbox);
    }
  }
  useEffect(() => {
    if (!map.current) return;
    map.current.on("load", () => {
      if (!map.current.getSource("satelliteLayer")) {
        addRasterLayer(
          map,
          "satelliteLayer_data",
          tileUrl,
          // "https://naxa.com.np/geoai/wastecoverageai/rastertile/{z}/{x}/{y}.png",
          "satelliteLayer_data"
        );
      }
      // if (!map.current.getSource("contours")) {
      //   addRasterLayer(
      //     map,
      //     "contours",
      //     "https://naxa.com.np/geoai/wastecoverageai/wastetile/{z}/{x}/{y}.png",
      //     "contours-data"
      //   );
      // }
    });
    MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
    MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
    MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";

    const Draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });
    setDrawState(Draw);
    map?.current?.addControl(Draw, "top-left");

    map?.current?.on("draw.create", function (e) {
      console.log(e.features);
      const originalPolygon = e.features?.[e.features.length - 1];
      const bbox = turf.bbox(originalPolygon);
      console.log(bbox, "bbox");
      setBbox(bbox);
    });
    // map?.current?.on("style.load", () => {
    //   const mapOverLayer = {
    //     satelliteLayer_data: "satelliteLayer_data",
    //   };
    //   // OpacityControl
    //   const Opacity = new OpacityControl({
    //     overLayers: mapOverLayer,
    //     opacityControl: true,
    //   });
    //   map?.current?.addControl(Opacity, "top-right");
    // });
    return () => {
      // map?.current?.removeControl(draw);
      // if (map.current.getLayer("contours-data")) {
      //   map.current.removeLayer("contours-data");
      // }
      // if (map.current.getSource("contours")) {
      //   map.current.removeSource("contours");
      // }
      // if (map.current.getLayer("satelliteLayer-data")) {
      //   map.current.removeLayer("satelliteLayer-data");
      // }
      // if (map.current.getSource("satelliteLayer")) {
      //   map.current.removeSource("satelliteLayer");
      // }
    };
  }, [map]);
  const zoomLevel = [18, 20];
  const predictWithBbox = () => {
    const dateFormattedForOutput = new Date();
    const dtText = `${dateFormattedForOutput.getDate()}${
      dateFormattedForOutput.getMonth() + 1
    }${dateFormattedForOutput.getFullYear()}${dateFormattedForOutput.getHours()}${dateFormattedForOutput.getMinutes()}${dateFormattedForOutput.getSeconds()}`;
    splitPolygon(drawState);
    const payload = {
      baseUrl: tileUrl,
      bbox: bbox,
      input_folder: "tiles",
      output_folder: dtText,
      max_workers: 10,
      zoom_level: [zoomLevel[0], zoomLevel[1]],
    };

    fetch("https://solidwasteapi.naxa.com.np/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    fetchPredictedTiles(dtText);
  };
  const fetchPredictedTiles = async (outputFolder) => {
    if (outputFolder) {
      while (true) {
        const checkTileResponse = await fetch(
          `https://solidwasteapi.naxa.com.np/check/${outputFolder}`
        );
        const checkTileJson = await checkTileResponse.json();
        console.log(checkTileJson, "checkTileResponse");
        const status = checkTileJson[1];

        if (status === 202) {
          setCurrentState("Tiles are processing...");
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Adjust the sleep duration as needed
        } else if (status === 200) {
          setCurrentState(
            `Tiles are ready for download ${checkTileJson[0]["url"]}`
          );

          addRasterLayer(
            map,
            "predicted_rasterlayer",
            checkTileJson[0]["url"],
            "predicted_rasterlayer_data",
            bbox
          );
          const mapOverLayer = {
            satelliteLayer_data: "satelliteLayer_data",
            predicted_rasterlayer_data: "predicted_rasterlayer_data",
          };
          // OpacityControl
          const Opacity = new OpacityControl({
            overLayers: mapOverLayer,
            opacityControl: true,
          });
          map?.current?.addControl(Opacity, "top-right");
          break;
        } else {
          setCurrentState(`Error: Unexpected status ${status}`);
          break;
        }
      }
    }

    // Uncomment the code below if needed
    // try {
    //     createDownloadZip(outputFolder, "./output.zip", "example.zip");
    // } catch (error) {
    //     st.sidebar.error(`Error: ${error}`);
    // }
  };
  useEffect(() => {
    if (!map?.current) return null;
    if (tileUrl === "") return null;
    const source = map?.current?.getSource("satelliteLayer_data");
    console.log(source, "source");
    if (source) {
      source?.setTiles([tileUrl]);
    }
  }, [tileUrl]);

  return (
    <div className="flex">
      <div className="sidebar w-80 h-auto p-4">
        <div className="p-2 ">
          <p>Tile Url:</p>
          <input
            className="p-2 border-2 border-gray-600 rounded"
            type="text"
            onChange={(e) => {
              setTileUrl(e.target.value);
            }}
            value={tileUrl}
          />
        </div>
        <div className="p-2 mt-10 ">
          <p>Zoom Level Range to Predict</p>
          <Slider
            getAriaLabel={() => "Temperature range"}
            value={value}
            onChange={handleChange}
            valueLabelDisplay="auto"
            max={25}
            min={1}
            // getAriaValueText={valuetext}
          />
        </div>
        <p>
          Zoom Level:{" "}
          <span>
            {value[0]} - {value[1]}
          </span>
        </p>
        <div className="flex justify-center">
          <button
            className="p-2 my-4 bg-red-600 text-white hover:bg-red-800 rounded"
            onClick={predictWithBbox}
          >
            Predict
          </button>
        </div>
        <h2>Status: {currentState}</h2>
      </div>
      <div ref={mapContainerRef} id="map" />
      {/* <div className="absolute flex flex-col top-0 right-0 p-4 w-auto h-auto ">
        <div>
          <div
            className={`heading flex items-center cursor-pointer w-full ${
              activeLayer.includes("satellite") ? "bg-orange-500" : "bg-black"
            } text-white bg-opacity-100 p-1 rounded-[50px] text-[16px] m-1`}
            onClick={() => handleClick("satellite")}
          >
            <img
              className="bg-white p-1 text-black rounded-[50px] text-[16px]"
              src="https://hwcw.naxa.com.np/7637ea1322b7cefe4eac307c47037080.png"
              alt="temperature"
              style={{ width: "30px" }}
            />
            <h5 className="ml-1 font-bold text-sm">Satellite</h5>
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => {
              splitPolygon(drawState);
            }}
          >
            splitPolygon
          </button>
        </div>
        <div>
          <div
            className={`heading flex items-center cursor-pointer w-full ${
              activeLayer.includes("waste") ? "bg-orange-500" : "bg-black"
            } text-white bg-opacity-100 p-1 rounded-[50px] text-[16px] m-1`}
            onClick={() => handleClick("waste")}
          >
            <img
              className="bg-white p-1 text-black rounded-[50px] text-[16px]"
              src="https://hwcw.naxa.com.np/7637ea1322b7cefe4eac307c47037080.png"
              alt="wind"
              style={{ width: "30px" }}
            />
            <h5 className="ml-1 font-bold text-sm">Waste Layer</h5>
          </div>
        </div>
      </div> */}
    </div>
  );
}

export default App;
