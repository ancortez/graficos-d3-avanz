// I. Configuración
graf = d3.select('#graf')

ancho_total = graf.style('width').slice(0, -2)
alto_total = ancho_total * 0.5625

margins = { 
  top: 30, 
  left: 60, 
  right: 30, 
  bottom: 30 }

ancho = ancho_total - margins.left - margins.right
alto  = alto_total - margins.top - margins.bottom

// Area de visualización
svg = graf.append('svg')
          .style('width', `${ ancho_total }px`)
          .style('height', `${ alto_total }px`)

//Contenedor "interno" donde van a estar los gráficos
g = svg.append('g')
        .attr('transform', `translate(${ margins.left }, ${ margins.top })`)
        .attr('width', ancho + 'px')
        .attr('height', alto + 'px')

//Capa del año que se ve al fondo
fontsize = alto * 0.4
mesDisplay = g.append('text')
                .attr('x', ancho / 2)
                .attr('y', (alto / 2) + (fontsize/2))
                .attr('text-anchor', 'middle')
                .attr('font-family', 'Roboto')
                .attr('font-size', `${fontsize}px`)
                .attr('fill','#ccc')
                .text('ago/2012')

g.append('rect')
  .attr('x',0)
  .attr('y',0)
  .attr('width', ancho)
  .attr('height', alto)
  .attr('stroke', 'black')
  .attr('fill', 'none')

g.append('clipPath')
  .attr('id', 'clip')
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', ancho)
    .attr('height', alto)

//Escaladores
x = d3.scaleLog().range([0, ancho])
y = d3.scaleLinear().range([alto, 0])
r = d3.scaleLinear().range([8, 80])

color = d3.scaleOrdinal().range(d3.schemeTableau10)

//Variables Globales
datos = []
mes = []
imes = 0
maxy = 0
miny = 201208
tipo_pago = 'todos'
var corriendo = true
var interval

tipopSelect = d3.select('#tipo_pago')
botonPausa = d3.select('#pausa')
slider = d3.select('#slider')

d3.csv('datasets/aguap_meses.csv').then((data) =>{
  data.forEach((d) => {
    d.consumo = +d.consumo
    d.rezago = +d.rezago
    d.total = +d.total
    d.anio = +d.anio
    d.consec_mes = +d.consec_mes

    if(d.consec_mes > maxy) maxy = d.consec_mes
    if(d.consec_mes < miny) miny = d.consec_mes
  })

  //console.log(`miny=${miny} maxy=${maxy}`)
  meses = Array.from(new Set(d3.map(data, d => d.consec_mes)))
  //console.log(meses)

  data = data.filter((d) => {
    return (d.total > 0) && (d.total > 0)
  })
  

  datos = data
  
  slider.attr('min', 0)
    .attr('max', meses.length - 1)
  slider.node().value = 0

  //El dominio para el escalador ordinal
  color.domain(d3.map(data, d => d.colonia))
  
 
//Escaladores de las X, Y y radios de los circulos
  x.domain([d3.min(datos, d => d.anio),
            d3.max(datos, d => d.anio)])
  if(tipo_pago == 'todos'){
  y.domain([d3.min(datos, d => d.total),
            d3.max(datos, d => d.total)])
    r.domain([d3.min(datos, d => d.total),
            d3.max(datos, d => d.total)])
  }
  else {
    y.domain([d3.min(datos, d => d[tipo_pago]),
            d3.max(datos, d => d[tipo_pago])])
    r.domain([d3.min(datos, d => d[tipo_pago]),
            d3.max(datos, d => d[tipo_pago])])
  }
  

//ejes
xAxis = d3.axisBottom(x)
          .ticks(8)
          .tickFormat(d => d3.format('')(d))
xAxisG = d3.axisBottom(x)
            .ticks(8)
            .tickFormat('')
            .tickSize(-alto)

//Llamada a los ejes
yAxis = d3.axisLeft(y)
          .ticks(10)
yAxisG = d3.axisLeft(y)
            .ticks(10)
            .tickFormat('')
            .tickSize(-ancho)

g.append('g')
  .call(xAxis)
  .attr('transform', `translate(0,${alto})`)
g.append('g')
  .call(yAxis)

g.append('g')
  .call(xAxisG)
  .attr('transform', `translate(0,${alto})`)
  .attr('class', 'ejes')
g.append('g')
  .call(yAxisG)
  .attr('class', 'ejes')


  frame()
  interval = d3.interval(() => delta(1), 600)
  })


function frame() {
  mes = meses[imes]
  
  data = d3.filter(datos, d => d.consec_mes == mes)
  data = d3.filter(data, d => {
    if (tipo_pago == 'todos')
      return tipo_pago = 'total'
    else
      return tipo_pago
  })
  //console.log(tipo_pago)
  //console.log(data)

  slider.node().value = imes
  render()
}

function render() {
  mesDisplay.text(meses[imes])
  //mesDisplay.text(meses[imes])
  //mesDisplay.text(data, d => x(d.anio))

  p = g.selectAll('circle')
        .data(data, d => d.colonia)


  p.enter()
    .append('circle')
      .attr('r',0)
      .attr('cx', d => x(d.anio))
      .attr('cy', d => y(d[tipo_pago]))
      .attr('fill', '#005500')
      .attr('clip-path', 'url(#clip)')
      .attr('stroke', '#EFEFEF')
      .attr('fill-opacity', 0.80)
    .merge(p)
      .transition().duration(600)
      .attr('cx', d => x(d.anio))
      .attr('cy', d => y(d[tipo_pago]))
      .attr('r', d => r(d[tipo_pago]))
      .attr('fill', d => color(d.colonia))
  p.exit()
    .transition().duration(200)
    .attr('r', 0)
    .attr('fill', '#ff0000')
    .remove()


}

//function atras() {
//  iyear--
//  if(iyear < 0) iyear = 0
//  frame()
//}
//
//function adelante() {
//  iyear++
//  if(iyear > years.lenght) iyear = years.lenght
//  frame()
//}
//


//Refactoring de las funciones de control de años
//DRY (Don't Repeat Yourself)

function delta(d){
  imes += d
  //console.log(iyear)

  if (imes < 0) imes = meses.length-1
  if (imes > meses.length-1) imes = 0
  
  frame()
}

tipopSelect.on('change', () => {
  tipo_pago = tipopSelect.node().value
  //console.log(tipo_pago)
  frame()
})

botonPausa.on('click', () => {
  corriendo = !corriendo
  if(corriendo){
    botonPausa
      .classed('btn-danger', true)
      .classed('btn-success', false)
      .html('<i class="fas fa-pause-circle"></i>')
    interval = d3.interval(() => delta(1), 600)

  } else {
    botonPausa
      .classed('btn-danger', false)
      .classed('btn-success', true)
      .html('<i class="fas fa-play-circle"></i>')
    interval.stop()
  }
})

slider.on('input', () => {
  //d3.slider('#sliderv').text(slider.node().value)
  imes = +slider.node().value
  //console.log(imes)
  frame()
})

slider.on('mousedown', () => {
  if(corriendo) interval.stop()

})

slider.on('mouseup', () => {
  if(corriendo) interval = d3.interval(() => delta(1), 600)
})