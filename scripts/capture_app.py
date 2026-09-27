"""Capture the current desktop UI with real local training results.

Run with the app's Python environment:
  python scripts/capture_app.py --app "../ML Studio"
Uses an isolated temporary project; never opens a user's project.
"""
from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
import tempfile
import time


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--app", type=Path, required=True)
    parser.add_argument("--datasets-only", action="store_true", help="Refresh only the datasets page capture")
    args = parser.parse_args()
    sys.path.insert(0, str(args.app.resolve()))
    task_home = Path(tempfile.mkdtemp(prefix="aimaestro-site-"))
    os.environ["AIMAESTRO_HOME"] = str(task_home / "home")
    os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")
    os.environ.setdefault("QT_QUICK_BACKEND", "software")
    os.environ.setdefault("QT_SCALE_FACTOR", "1.5")
    os.environ["QT_QUICK_CONTROLS_STYLE"] = "Basic"

    from PySide6.QtCore import QObject, QUrl
    from PySide6.QtQuickControls2 import QQuickStyle
    from PySide6.QtWidgets import QApplication
    from aimaestro.app.application import fonts
    from aimaestro.app.application.controller import AppController
    from aimaestro.app.configuration.paths import qml_root
    from aimaestro.app.main import create_engine
    from aimaestro.ml.bootstrap import bootstrap

    app = QApplication([])
    QQuickStyle.setStyle("Basic")
    fonts.install()
    bootstrap()
    controller = AppController()
    controller.device = "cpu"
    assert controller.newProject(str(task_home / "project"), "Model Lab")
    assert controller.createFromTemplate("wf-breast-cancer")
    controller.saveWorkflow()
    engine = create_engine(controller)
    engine.load(QUrl.fromLocalFile(str(qml_root() / "App.qml")))
    win = engine.rootObjects()[0]
    win.setWidth(1440)
    win.setHeight(600)
    win.setProperty("showLibrary", False)
    win.setProperty("showBottom", False)
    out = Path(__file__).resolve().parents[1] / "assets" / "screenshots"

    def pump(seconds=0.8):
        until = time.monotonic() + seconds
        while time.monotonic() < until:
            app.processEvents()
            time.sleep(0.01)

    def item(prefix):
        return next(o for o in win.findChildren(QObject) if o.metaObject().className().startswith(prefix + "_QML"))

    def capture(name):
        pump()
        image = win.grabWindow()
        assert not image.isNull(), "No rendered frame"
        assert image.save(str(out / (name + ".webp")), "WEBP", 92)
        print(f"Captured {name}: {image.width()}x{image.height()}", flush=True)

    def run():
        assert controller.runWorkflow(), "Run refused"
        deadline = time.monotonic() + 180
        while controller.running and time.monotonic() < deadline:
            pump(0.1)
        assert not controller.running, "Training timed out"
        pump()
        assert controller.results.get("metrics"), controller.results

    try:
        pump(2)
        for dataset_id in ("iris", "wine", "breast-cancer-wisconsin"):
            previous_count = controller.datasets.count
            assert controller.installCatalogDataset(dataset_id)
            deadline = time.monotonic() + 60
            while controller.datasets.count == previous_count and time.monotonic() < deadline:
                pump(0.2)
            assert controller.datasets.count > previous_count, f"Could not install {dataset_id}"
        win.setHeight(900)
        win.showPage("datasets")
        pump(2)
        capture("datasets")
        if args.datasets_only:
            print(f"Demo project: {task_home}", flush=True)
            return
        win.backToCanvas()
        win.setHeight(600)
        pump()
        graph = item("WorkflowCanvas")
        graph.fitView()
        capture("workflow")
        win.setHeight(960)
        win.setProperty("showBottom", True)
        win.setProperty("bottomHeight", 570)
        run()
        graph.fitView()
        capture("overview")
        flick = next(o for o in item("ResultsView").findChildren(QObject) if o.metaObject().indexOfProperty("contentY") >= 0)
        flick.setProperty("contentY", 400)
        capture("results")
        flick.setProperty("contentY", 0)
        for trees in (100, 500):
            controller.workflow.setConfig("n-model", "estimators", trees)
            controller.saveWorkflow()
            run()
        item("BottomPanel").setProperty("current", "experiments")
        win.setHeight(720)
        win.setProperty("bottomHeight", 280)
        pump()
        graph.fitView()
        capture("leaderboard")

        # A small structure-only CSV demonstrates the actual molecule viewer.
        sample = task_home / "structures.csv"
        sample.write_text("name,smiles\nStructure 1,CC(=O)Oc1ccccc1C(=O)O\nStructure 2,Cn1c(=O)c2c(ncn2C)n(C)c1=O\nStructure 3,c1ccccc1\nStructure 4,CCO\nStructure 5,Oc1ccccc1\nStructure 6,CC(=O)Nc1ccc(O)cc1\n", encoding="utf-8")
        previous_count = controller.datasets.count
        assert controller.importDataset(str(sample), "Molecular structures", "")
        deadline = time.monotonic() + 60
        while controller.datasets.count == previous_count and time.monotonic() < deadline:
            pump(0.2)
        assert controller.datasets.count > previous_count
        record = next(controller.datasets.item(i) for i in range(controller.datasets.count) if controller.datasets.item(i)["name"] == "Molecular structures")
        win.setWidth(1200)
        win.setHeight(800)
        win.openDataset(record["datasetId"])
        pump()
        item("DatasetPage").setProperty("tab", "molecules")
        pump(2)
        assert item("DatasetMoleculesView").property("selected") >= 0
        capture("molecule")
        print(f"Demo project: {task_home}", flush=True)
    finally:
        controller.shutdown()
        win.close()
        engine.deleteLater()
        app.processEvents()


if __name__ == "__main__":
    main()
