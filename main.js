(() => {
  let gridSize = 8;
  let currentRegionId = 1;
  let isPlayMode = false;
  let autoXMode = false;
  let puzzleGrid = [];
  let boardState = [];
  let autoXMap = [];

  const regionColors = new Map();
  let isDragging = false;

  const gridEl = document.getElementById("grid");
  const gridSizeInput = document.getElementById("gridSize");
  const regionIdInput = document.getElementById("regionId");
  const toggleModeBtn = document.getElementById("toggleModeBtn");
  const autoXToggleBtn = document.getElementById("autoXToggleBtn");
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const jsonArea = document.getElementById("jsonArea");

  function getColorForRegion(id) {
    if (id === 0) return "#222";
    if (!regionColors.has(id)) {
      const goldenAngle = 137.508;
      const hue = (id * goldenAngle) % 360;
      regionColors.set(id, `hsl(${hue}, 70%, 60%)`);
    }
    return regionColors.get(id);
  }

  function initGrid() {
    puzzleGrid = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(0)
    );
    boardState = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill("")
    );
    autoXMap = Array.from({ length: gridSize }, () =>
      Array(gridSize).fill(false)
    );
    renderGrid();
  }

  function renderGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 40px)`;
    gridEl.style.gridTemplateRows = `repeat(${gridSize}, 40px)`;
    gridEl.innerHTML = "";

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (!isPlayMode) {
          const baseColor = "white";
          const regionId = puzzleGrid[r][c];
          let overlayColor = "transparent";
          if (regionId > 0) {
            overlayColor = getColorForRegion(regionId)
              .replace("hsl", "hsla")
              .replace(")", ", 0.35)");
          }
          cell.style.background = `linear-gradient(${overlayColor}, ${overlayColor}), ${baseColor}`;
        } else {
          cell.style.backgroundColor = getColorForRegion(puzzleGrid[r][c]);

          let borderTop = "1px";
          let borderRight = "1px";
          let borderBottom = "1px";
          let borderLeft = "1px";

          const region = puzzleGrid[r][c];
          if (r === 0 || puzzleGrid[r - 1][c] !== region) borderTop = "3px";
          if (c === gridSize - 1 || puzzleGrid[r][c + 1] !== region)
            borderRight = "3px";
          if (r === gridSize - 1 || puzzleGrid[r + 1][c] !== region)
            borderBottom = "3px";
          if (c === 0 || puzzleGrid[r][c - 1] !== region) borderLeft = "3px";

          cell.style.border = "";
          cell.style.borderTop = `${borderTop} solid black`;
          cell.style.borderRight = `${borderRight} solid black`;
          cell.style.borderBottom = `${borderBottom} solid black`;
          cell.style.borderLeft = `${borderLeft} solid black`;
        }

        if (isPlayMode) {
          if (boardState[r][c] === "X") {
            cell.textContent = "X";
            cell.classList.add("X");
          } else if (boardState[r][c] === "P") {
            cell.textContent = "🎃";
            cell.classList.add("P");
          } else {
            cell.textContent = "";
          }
        } else {
          cell.textContent = puzzleGrid[r][c] === 0 ? "" : puzzleGrid[r][c];
        }

        cell.addEventListener("click", () => onCellClick(r, c));
        cell.addEventListener("mousedown", () => onDragStart(r, c));
        cell.addEventListener("mouseover", () => onDragOver(r, c));
        gridEl.appendChild(cell);
      }
    }

    if (isPlayMode) validateBoard();
  }

  function onCellClick(r, c) {
    if (isPlayMode) {
      cyclePlayCell(r, c);
    } else {
      paintRegion(r, c);
    }
  }

  function onDragStart(r, c) {
    if (!isPlayMode) return;
    isDragging = true;
    paintXIfEmpty(r, c);
  }

  function onDragOver(r, c) {
    if (!isPlayMode || !isDragging) return;
    paintXIfEmpty(r, c);
  }

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });

  function paintXIfEmpty(r, c) {
    if (boardState[r][c] === "") {
      boardState[r][c] = "X";
      renderGrid();
    }
  }

  function paintRegion(r, c) {
    puzzleGrid[r][c] = currentRegionId;
    renderGrid();
  }

  function cyclePlayCell(r, c) {
    const val = boardState[r][c];
    if (val === "") {
      boardState[r][c] = "X";
    } else if (val === "X") {
      boardState[r][c] = "P";
      if (autoXMode) placeAutoX(r, c);
    } else if (val === "P") {
      if (autoXMode) removeAutoX(r, c);
      boardState[r][c] = "";
    }
    renderGrid();
  }

  function placeAutoX(r, c) {
    for (let i = 0; i < gridSize; i++) {
      if (boardState[r][i] === "") {
        boardState[r][i] = "X";
        autoXMap[r][i] = true;
      }
      if (boardState[i][c] === "") {
        boardState[i][c] = "X";
        autoXMap[i][c] = true;
      }
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < gridSize &&
          nc >= 0 &&
          nc < gridSize &&
          boardState[nr][nc] === ""
        ) {
          boardState[nr][nc] = "X";
          autoXMap[nr][nc] = true;
        }
      }
    }
  }

  function removeAutoX(r, c) {
    for (let i = 0; i < gridSize; i++) {
      if (autoXMap[r][i]) {
        boardState[r][i] = "";
        autoXMap[r][i] = false;
      }
      if (autoXMap[i][c]) {
        boardState[i][c] = "";
        autoXMap[i][c] = false;
      }
    }

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < gridSize &&
          nc >= 0 &&
          nc < gridSize &&
          autoXMap[nr][nc]
        ) {
          boardState[nr][nc] = "";
          autoXMap[nr][nc] = false;
        }
      }
    }
  }

  function validateBoard() {
    document
      .querySelectorAll(".cell")
      .forEach((c) => c.classList.remove("invalid"));

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (boardState[r][c] === "P") {
          const region = puzzleGrid[r][c];
          const cellEl = document.querySelector(
            `.cell[data-r='${r}'][data-c='${c}']`
          );

          for (let i = 0; i < gridSize; i++) {
            if (i !== c && boardState[r][i] === "P")
              cellEl.classList.add("invalid");
            if (i !== r && boardState[i][c] === "P")
              cellEl.classList.add("invalid");
          }

          for (let rr = 0; rr < gridSize; rr++) {
            for (let cc = 0; cc < gridSize; cc++) {
              if (
                (rr !== r || cc !== c) &&
                boardState[rr][cc] === "P" &&
                puzzleGrid[rr][cc] === region
              ) {
                cellEl.classList.add("invalid");
              }
            }
          }

          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
                if (boardState[nr][nc] === "P") cellEl.classList.add("invalid");
              }
            }
          }
        }
      }
    }
  }

  function exportPuzzle() {
    return JSON.stringify({ gridSize, puzzleGrid });
  }

  function importPuzzle(jsonStr) {
    try {
      const obj = JSON.parse(jsonStr);
      if (typeof obj.gridSize !== "number" || !Array.isArray(obj.puzzleGrid)) {
        alert("Invalid puzzle JSON");
        return;
      }
      gridSize = obj.gridSize;
      puzzleGrid = obj.puzzleGrid;
      boardState = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill("")
      );
      autoXMap = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(false)
      );
      gridSizeInput.value = gridSize;
      regionIdInput.value = 1;
      isPlayMode = false;
      toggleModeBtn.textContent = "Switch to Play Mode";
      autoXToggleBtn.style.display = "none";
      regionColors.clear();
      renderGrid();
    } catch (e) {
      alert("Invalid JSON");
    }
  }

  gridSizeInput.addEventListener("change", () => {
    const val = +gridSizeInput.value;
    if (val >= 4 && val <= 20) {
      gridSize = val;
      currentRegionId = 1;
      regionIdInput.value = 1;
      regionColors.clear();
      initGrid();
    } else {
      alert("Grid size must be between 4 and 20");
      gridSizeInput.value = gridSize;
    }
  });

  regionIdInput.addEventListener("change", () => {
    const val = +regionIdInput.value;
    if (val >= 1) currentRegionId = val;
    else regionIdInput.value = currentRegionId;
  });

  toggleModeBtn.addEventListener("click", () => {
    isPlayMode = !isPlayMode;
    if (isPlayMode) {
      toggleModeBtn.textContent = "Switch to Create Mode";
      autoXToggleBtn.style.display = "";
      boardState = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill("")
      );
      autoXMap = Array.from({ length: gridSize }, () =>
        Array(gridSize).fill(false)
      );
    } else {
      toggleModeBtn.textContent = "Switch to Play Mode";
      autoXToggleBtn.style.display = "none";
    }
    renderGrid();
  });

  autoXToggleBtn.addEventListener("click", () => {
    autoXMode = !autoXMode;
    autoXToggleBtn.textContent = `Auto X Around Pumpkin: ${
      autoXMode ? "ON" : "OFF"
    }`;
  });

  exportBtn.addEventListener("click", () => {
    const json = exportPuzzle();
    jsonArea.value = json;
    jsonArea.select();
    document.execCommand("copy");
    alert("Puzzle JSON copied to clipboard");
  });

  importBtn.addEventListener("click", () => {
    const json = jsonArea.value.trim();
    if (json) importPuzzle(json);
  });

  initGrid();
})();
