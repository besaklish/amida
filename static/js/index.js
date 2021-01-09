class ColumnLineManager {
  constructor() {
    this.columnLines = [];
  }

  pushColumnLine(cl) {
    this.columnLines.push(cl)
  }

  getColumnLineById(id) {
    for (const cl of this.columnLines) {
      if (cl.id === id) {
        return cl
      }
    }
    return
  }

  length() {
    return this.columnLines.length;
  }
}


class ColumeLine {
  constructor(id, line) {
    this.id = id;
    this.line = line;
  }
}


class BranchManager {
  constructor() {
    this.branches = [];
  }

  pushBranch(branch) {
    this.branches.push(branch)
  }

  length() {
    return this.branches.length;
  }
}


class Branch {
  constructor(leftColumnNumber, leftBreakpointRate, rightBreakpointRate) {
    this.leftColumnNumber = leftColumnNumber;
    this.rightColumnNumber = leftColumnNumber + 1;
    this.leftBreakpointRate = leftBreakpointRate;
    this.rightBreakpointRate = rightBreakpointRate;
    this.branchesOnColumnLines = [];
  }
}


class TraceRecord {
  constructor(columnNumber, columnLengthRate) {
    this.columnNumber = columnNumber;
    this.columnLengthRate = columnLengthRate;
  }
}


class Tracer {
  constructor(ColumnLineManager, BranchManager) {
    this.columnNumber;
    this.columnLengthRate;
    this.clm = ColumnLineManager;
    this.bm = BranchManager;
    this.branchesOnColumnLines = [];
    this.traceRecords = [];
  }

  trace(startColumnNumber) {
    this.updateBranchesOnColumnLines();
    this.columnNumber = startColumnNumber;
    this.columnLengthRate = 0;
    this.traceRecords = [];

    this.traceRecords.push(new TraceRecord(this.columnNumber, this.columnLengthRate));

    while (true) {
      const nextBranch = this.getNextBranch(this.columnNumber, this.columnLengthRate);
      if (nextBranch === undefined) {
        break;
      }
      if (nextBranch.leftColumnNumber === this.columnNumber) {
        this.traceRecords.push(new TraceRecord(nextBranch.leftColumnNumber, nextBranch.leftBreakpointRate));
        this.traceRecords.push(new TraceRecord(nextBranch.rightColumnNumber, nextBranch.rightBreakpointRate));
      } else {
        this.traceRecords.push(new TraceRecord(nextBranch.rightColumnNumber, nextBranch.rightBreakpointRate));
        this.traceRecords.push(new TraceRecord(nextBranch.leftColumnNumber, nextBranch.leftBreakpointRate));
      }
      this.setNextState(this.columnNumber, this.columnLengthRate);
    }
    this.traceRecords.push(new TraceRecord(this.columnNumber, 1));
    console.log(this.traceRecords);
  }

  updateBranchesOnColumnLines() {
    this.branchesOnColumnLines = [];

    for (let i = 0; i < this.clm.length(); i++) {
      this.branchesOnColumnLines.push([]);
    }

    for (const branch of this.bm.branches) {
      this.branchesOnColumnLines[branch.leftColumnNumber].push(branch);
      this.branchesOnColumnLines[branch.rightColumnNumber].push(branch);
    }

    for (let i = 0; i < this.clm.length(); i++) {
      this.branchesOnColumnLines[i].sort((b1, b2) => {
        if (b1.leftColumnNumber === i && b2.leftColumnNumber === i) {
          return b1.leftBreakpointRate > b2.leftBreakpointRate ? 1 : -1;
        } else if (b1.leftColumnNumber === i && b2.rightColumnNumber === i) {
          return b1.leftBreakpointRate > b2.rightBreakpointRate ? 1 : -1;
        } else if (b1.rightColumnNumber === i && b2.leftColumnNumber === i) {
          return b1.rightBreakpointRate > b2.leftBreakpointRate ? 1 : -1;
        } else {
          return b1.rightBreakpointRate > b2.rightBreakpointRate ? 1 : -1;
        }
      })
    }
  }

  getNextBranch(currentColumnNumber, currentLengthRate) {
    const branchesOnColumnLine = this.branchesOnColumnLines[currentColumnNumber];
    for (const branch of branchesOnColumnLine) {
      if (branch.leftColumnNumber === currentColumnNumber) {
        if (branch.leftBreakpointRate > currentLengthRate) {
          return branch
        }
      } else {
        if (branch.rightBreakpointRate > currentLengthRate) {
          return branch
        }
      }
    }
    return;
  }

  setNextState(currentColumnNumber, currentLengthRate) {
    const branchesOnColumnLine = this.branchesOnColumnLines[currentColumnNumber];
    for (const branch of branchesOnColumnLine) {
      if (branch.leftColumnNumber === currentColumnNumber) {
        if (branch.leftBreakpointRate > currentLengthRate) {
          this.columnNumber = currentColumnNumber + 1;
          this.columnLengthRate = branch.rightBreakpointRate;
          return true
        }
      } else {
        if (branch.rightBreakpointRate > currentLengthRate) {
          this.columnNumber = currentColumnNumber - 1;
          this.columnLengthRate = branch.leftBreakpointRate;
          return true
        }
      }
    }
    return false;
  }
}


class AmidaDrawingManager {
  constructor(sizeX, sizeY, addTo) {
    this.draw = SVG().addTo(addTo).size(sizeX, sizeY);

    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.nameRowSpaceEnd = 0.2;
    this.amidaRowSpaceEnd = 0.7;
    // this.resultRowSpaceEnd = 1.0;

    this.numOfKujis = 3;

    this.clm = new ColumnLineManager();
    this.bm = new BranchManager();
    this.tracer = new Tracer(this.clm, this.bm);
  }

  XRate2Abs(rate) {
    return this.sizeX * rate;
  }

  YRate2Abs(rate) {
    return this.sizeY * rate;
  }

  setNumOfKujis(n) {
    this.numOfKujis = n;
  }

  drawColumnLines() {
    const lines = [];
    const resultNumber = Math.floor(Math.random() * this.numOfKujis);
    for (let i = 0; i < this.numOfKujis; i++) {
      console.log("drawing a line");
      const xStart = this.XRate2Abs(1) / (this.numOfKujis + 1) * (i + 1);
      const yStart = this.YRate2Abs(this.nameRowSpaceEnd);
      const xEnd = xStart;
      const yEnd = this.YRate2Abs(this.amidaRowSpaceEnd);
      const line = this.draw.line(xStart, yStart, xEnd, yEnd)
      lines.push(line);
      console.log(line);

      const cl = new ColumeLine(i, line);
      this.clm.pushColumnLine(cl);

      const text = this.draw.text((i + 1).toString()).move(xStart, yStart - this.XRate2Abs(1 / this.numOfKujis / 4));
      text.font({
        size: this.XRate2Abs(1 / this.numOfKujis / 4),
        anchor: 'middle'
      });

      const resultText = this.draw.text(i === resultNumber ? "×" : "○").move(xEnd, yEnd);
      resultText.font({
        size: this.XRate2Abs(1 / this.numOfKujis / 4),
        anchor: 'middle'
      });

    }

    for (const line of lines) {
      line.stroke({ color: "#000", width: 0, linecap: 'round' });
      line.animate(1000, 0, 'now').stroke({ width: 3 });
    }
  }

  addBranch() {
    console.log("adding a branch");
    const choices = [];
    for (let i = 0; i < this.numOfKujis - 1; i++) {
      choices.push(i);
    }

    const leftColumnNumber = choices[Math.floor(Math.random() * (this.numOfKujis - 1))];
    const rightColumnNumber = leftColumnNumber + 1;

    // console.log(`1st #: ${leftColumnNumber}, 2nd #: ${rightColumnNumber}`);

    const leftBreakpointRate = Math.random();
    const rightBreakpointRate = Math.random();

    const columnLength = this.YRate2Abs(this.amidaRowSpaceEnd - this.nameRowSpaceEnd);
    const leftBreakpoint = this.YRate2Abs(this.nameRowSpaceEnd) + leftBreakpointRate * columnLength;
    const rightBreakpoint = this.YRate2Abs(this.nameRowSpaceEnd) + rightBreakpointRate * columnLength;

    const xStart = this.clm.getColumnLineById(leftColumnNumber).line.attr("x1");
    const yStart = leftBreakpoint;
    const xEnd = this.clm.getColumnLineById(rightColumnNumber).line.attr("x1");
    const yEnd = rightBreakpoint;

    const line = this.draw.line(xStart, yStart, xEnd, yEnd);
    line.stroke({ color: "#000", width: 3, linecap: 'round' });
    const branch = new Branch(leftColumnNumber, leftBreakpointRate, rightBreakpointRate);
    this.bm.pushBranch(branch);
  }

  drawTraceRecords(columnNumber) {
    this.tracer.trace(columnNumber);
    const traceRecords = this.tracer.traceRecords;
    let pathString = "";
    for (let i = 0; i < traceRecords.length; i++) {
      const x = this.clm.getColumnLineById(traceRecords[i].columnNumber).line.attr("x1");

      const columnLength = this.YRate2Abs(this.amidaRowSpaceEnd - this.nameRowSpaceEnd);
      const y = this.YRate2Abs(this.nameRowSpaceEnd) + traceRecords[i].columnLengthRate * columnLength;
      if (i === 0) {
        pathString = `M ${x} ${y}`;
      } else {
        pathString = pathString + ` L ${x} ${y}`;
      }
    }
    const path = this.draw.path(pathString);
    path.stroke({ color: "#f55", width: 10 });
    path.fill('none');
    path.attr({ pathLength: 1, "stroke-dashoffset": 1, "stroke-dasharray": 1, opacity: 0.3 });
    path.addClass(`columnNumber-${columnNumber}`);
    path.animate(2000, 1000, 'now').attr({ "stroke-dashoffset": 0 });
  }

  removeTraceRecords(columnNumber) {
    const className = `columnNumber-${columnNumber}`;
    const path = SVG("path." + className);
    path.remove();
  }

  highlightSpaces() {
    let nameSpaceRect = this.draw.rect(this.XRate2Abs(1), this.YRate2Abs(this.nameRowSpaceEnd));
    let amidaSpaceRect = this.draw.rect(this.XRate2Abs(1), this.YRate2Abs(this.amidaRowSpaceEnd));
    let resultSpaceRect = this.draw.rect(this.XRate2Abs(1), this.YRate2Abs(1));
    let rects = [nameSpaceRect, amidaSpaceRect, resultSpaceRect];
    for (let i = 0; i < rects.length; i++) {
      let fill = "#" + "f0" + (i * 2).toString() + "3";
      rects[i].css({
        fill: fill
      })
    }
  }

  reset() {
    this.clm = new ColumnLineManager();
    this.bm = new BranchManager();
    this.tracer = new Tracer(this.clm, this.bm);
    adm.draw.clear();
  }

}

let adm = new AmidaDrawingManager(window.innerWidth, window.innerHeight * 0.7, 'div.svg');
adm.setNumOfKujis(5);
adm.drawColumnLines();
// adm.highlightSpaces();
adm.addBranch();
adm.addBranch();
adm.addBranch();
adm.addBranch();
adm.addBranch();

const play = async () => {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < adm.numOfKujis; i++) {
    adm.drawTraceRecords(i);
    await delay(4000);
    adm.removeTraceRecords(i);
    await delay(2000);
  }
}

const handleChangeNumOfKujis = event => {
  adm.reset();
  adm.setNumOfKujis(parseInt(event.target.value));
  adm.drawColumnLines();
  // adm.highlightSpaces();
}
