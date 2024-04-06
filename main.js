function sortBinsFirstFit(cuts, binSize) {
    let binQty = 0;
    let cutsQty = cuts.length;
    let result = new Array(cutsQty);

    //sort all the cuts in decreasing order
    cuts.sort((a, b) => b - a);

    for (let i = 0; i < cutsQty; i++) {
        //find the first bin that can accommodate the cut
        let j;
        for (j = 0; j < binQty; j++) {
            let isFit = result[j].reduce((a, b) => a + b, 0) + cuts[i] <= binSize;
            if (isFit) {
                let nextIndex = result[j].filter(Boolean).length;
                result[j][nextIndex] = cuts[i];
                break;
            }
        }

        //create a new bin if it doesn't fit any of the existing bins
        if (j == binQty) {
            result[binQty] = new Array(cutsQty);
            result[binQty][0] = cuts[i];
            binQty++;
        }
    }

    return result;
}

function sortBinsBestFit(cuts, binSize) {
    let binQty = 0;
    let cutsCount = cuts.length;
    let result = new Array(cutsCount);

    //sort all the cuts in decreasing order
    cuts.sort((a, b) => b - a);

    for (let i = 0; i < cutsCount; i++) {
        //find the "best" bin that can accommodate the cut
        let j,
        min = binSize + 1, 
        bestBin = 0;

        //iterate through all cuts
        for (j = 0; j < binQty; j++) {
            //get the tightest bin that can fit the cut
            let thisBinSize = result[j].reduce((a, b) => a + b, 0);
            let isFit = thisBinSize + cuts[i] <= binSize
            let isLessThanMin = binSize - (thisBinSize + cuts[i]) < min
            if (isFit && isLessThanMin) {
                bestBin = j;
                min = binSize - (thisBinSize + cuts[i]);
            }
        }

        //create a new bin if it doesn't fit any of the existing bins
        if (min == binSize + 1) {
            result[binQty] = new Array(cutsCount);
            result[binQty][0] = cuts[i];
            binQty++;
        } else { //assign to best bin
            result[bestBin][result[bestBin].filter(Boolean).length] = cuts[i];
        }
    }

    return result;
}

function sortBinsWorstFit(cuts, binSize) {
    //initialize variables
    let binsQty = 0;
    let cutsQty = cuts.length;
    let result = new Array(cutsQty);

    //sort all the cuts in decreasing order
    cuts.sort((a, b) => b - a);

    for (let i = 0; i < cutsQty; i++) {
        //find the best bin that can accommodate the cut
        let j;

        //initialize maximum space left, and index of worst bin
        let max = -1, worstBin = 0

        //iterate through all cuts
        for (j = 0; j < binsQty; j++) {
            //get the bin with the most empty space that can fit the cut
            let thisBinSize = result[j].reduce((a, b) => a + b, 0);
            let isFit = thisBinSize + cuts[i] <= binSize
            let isGreaterThanMax = binSize - (thisBinSize + cuts[i]) > max
            if (isFit && isGreaterThanMax) {
                worstBin = j;
                max = binSize - (thisBinSize + cuts[i]);
            }
        }

        //create a new bin if it doesn't fit any of the existing bins
        if (max == -1) {
            result[binsQty] = new Array(cutsQty);
            result[binsQty][0] = cuts[i];
            binsQty++;
        } else { //assign to worst bin
            result[worstBin][result[worstBin].filter(Boolean).length] = cuts[i];
        }
    }

    return result;
}

function getTableContents($table){
    let tableContents = '';
    $table.find('tbody tr').each(function() {
        $(this).find('td').each(function() {
            tableContents += $(this).text() + '\t';
        });
        tableContents += '\n';
    });
    return tableContents;
}

function createTableOutput(data, materialSize, $table) {
    let rowCount = data.filter(Boolean).length;
    let totalLength = data.map(n => n.reduce((a, b) => a + b, 0)).reduce((a, b) => a + b, 0);
    let scrapLength = (rowCount * materialSize - totalLength)/100;
   
    $table.find('th.count').text("Qty: " + rowCount);
    $table.find('th.scrap-length').text("Scrap: " + scrapLength.toFixed(2));
    
    let tbody = '';
    for (let i = 0; i < rowCount; i++) {
        if (data)
        tbody += '<tr>';
        for (let j = 0; j < data[i].filter(Boolean).length; j++) {
            tbody += '<td>' + parseFloat(data[i][j]).toFixed(2) / 100 + '</td>';
        }
        tbody += '</tr>';
    }

    $table.find('tbody').html(tbody);
}

function copyToClipboard($table) {
    if (navigator.clipboard) {
        let copyText = getTableContents($table);
        navigator.clipboard.writeText(copyText).catch(function (e) { 
            console.log(e) 
        });
    }
}

function showCopiedAlert($alert) {
    $alert.fadeTo(2000, 500).slideUp(500, function(){
        $alert.slideUp(500);
    });
}


$(document).ready(function(){
    $('#btn-compute').click(function() {
        let dataBestFit;
        let dataFirstFit;
        let dataWorstFit;
    
        let supply = $('#inv-size').val() * 100;
        try {
            let cuts = $('#lengths').val().trim().split('\n').map(n => Math.ceil(parseFloat(n) * 100));
            let quantities = $('#quantities').val().trim().split('\n').map(n => parseInt(n));
            
            if (cuts.length != quantities.length) {
                alert("Please ensure the number of rows are equal.");
                return;
            }
    
            let allCuts = new Array(quantities.reduce((a,b) => a + b));
            let allCutsPointer = 0;
            for (let i = 0; i < cuts.length; i++) {
                for (let j = 0; j < quantities[i]; j++) {
                    allCuts[allCutsPointer] = cuts[i];
                    allCutsPointer++;
                }
            }
            dataBestFit = sortBinsBestFit(allCuts, supply);
            dataFirstFit = sortBinsFirstFit(allCuts, supply);
            dataWorstFit = sortBinsWorstFit(allCuts, supply);
        } catch (e) {
            alert("Unable to compute, please check your inputs.");
            console.log(e);
        }
    
        createTableOutput(dataBestFit, supply, $('table#tbl-out-bestfit'));
        createTableOutput(dataFirstFit, supply, $('table#tbl-out-firstfit'));
        createTableOutput(dataWorstFit, supply, $('table#tbl-out-worstfit'));
    
        $('div.output').show();
    });
    
    $('#btn-clipboard-firstfit').click(function() {
        copyToClipboard($('table#tbl-out-firstfit'));
        showCopiedAlert($('#alr-copied-firstfit'));
    });
    
    $('#btn-clipboard-bestfit').click(function() {
        copyToClipboard($('table#tbl-out-bestfit'));
        showCopiedAlert($('#alr-copied-bestfit'));
    });
    
    $('#btn-clipboard-worstfit').click(function() {
        copyToClipboard($('table#tbl-out-worstfit'));
        showCopiedAlert($('#alr-copied-worstfit'));
    });
});


