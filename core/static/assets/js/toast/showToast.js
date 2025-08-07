showToast = (title, body, cssClass)=> {
    $.toast({
            heading: title,
            text: body,
            showHideTransition: 'slide',
            icon: cssClass,
            position: 'top-right',
            })
}