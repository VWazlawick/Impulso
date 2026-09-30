const fs = require("fs");
const sharp = require("sharp");
const { instance } = require("@viz-js/viz");

const dot = `digraph Arquitetura {
  rankdir=LR;
  graph [fontname="Helvetica", nodesep=0.6, ranksep=0.9];
  node [fontname="Helvetica", fontsize=13, shape=box, style="filled,rounded", fontcolor="white"];
  edge [fontname="Helvetica", fontsize=11, color="#555555"];

  Frontend [label="Frontend\\nReact", fillcolor="#2E75B6"];
  Backend [label="Backend\\nSpring Boot 3 (Java 17+)", fillcolor="#1F3864"];
  DB [label="PostgreSQL", fillcolor="#548235"];
  Security [label="Spring Security + JWT", fillcolor="#833C0C", shape=note, fontsize=11];

  Frontend -> Backend [label="  REST/JSON  "];
  Backend -> DB [label="  JPA  "];
  Security -> Backend [style=dashed, dir=back, label=" protege "];

  subgraph cluster_instancia {
    label="Uma instância por empresa cliente";
    style=dashed;
    color="#999999";
    fontname="Helvetica-Oblique";
    fontsize=11;
    Frontend; Backend; DB; Security;
  }
}`;

instance().then(async (viz) => {
  const svg = viz.renderString(dot, { format: "svg" });
  fs.writeFileSync("arch.svg", svg);
  await sharp(Buffer.from(svg), { density: 220 }).png().toFile("arch.png");
  const meta = await sharp("arch.png").metadata();
  console.log("PNG gerado:", meta.width, "x", meta.height);
}).catch((e) => { console.error(e); process.exit(1); });
