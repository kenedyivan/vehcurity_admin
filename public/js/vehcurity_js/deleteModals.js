function showModal(index, name) {
    $(".modal-content #guardId").val(index);
    $(".modal-body #message").html('Delete guard <span style="color:red;">' + name + '</span>?');
    $('#centralModalSm').modal('show')

}

function showOwnerModal(index, name){
    $("#centralModalSmOwner .modal-content #guardId").val(index);
    $("#centralModalSmOwner .modal-body #message").html('Delete owner <span style="color:red;">' + name + '</span>?');
    $('#centralModalSmOwner').modal('show')
}