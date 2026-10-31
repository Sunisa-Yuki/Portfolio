import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const title = document.querySelector('.projects-title');

let query = '';
let selectedIndex = -1;
let selectedYear = null; // track the selected year by label, not index

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

// ---------- Filters ----------
function filterBySearch(list) {
  return list.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}

function filterByYear(list) {
  if (selectedYear === null) return list;
  return list.filter((project) => project.year === selectedYear);
}

// ---------- Pie chart + legend ----------
function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  selectedIndex = data.findIndex((d) => d.label === selectedYear);

  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', i === selectedIndex ? 'selected' : null)
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
        selectedYear = selectedIndex === -1 ? null : data[i].label;
        update();
      });
  });

  data.forEach((d, i) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', i === selectedIndex ? 'selected' : null)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// ---------- Render everything ----------
function update() {
  const searched = filterBySearch(projects);
  renderPieChart(searched);
  const visible = filterByYear(searched);
  renderProjects(visible, projectsContainer, 'h2');
  title.textContent = `${visible.length} Projects`;
}

update();

// ---------- Search ----------
const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
  query = event.target.value;
  update();
});