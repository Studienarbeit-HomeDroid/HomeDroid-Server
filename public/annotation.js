const annotations = {
    dashboard: "dashboard",
    element2: "This is the annotation for element 2"
};

function applyDynamicAnnotations() {
    for (let id in annotations) {
        const element = document.getElementById(id);
        if (element) {
            element.setAttribute('data-annotation', annotations[id]);
        }
    }
}

window.onload = () => {
    console.log("Fenster geladen");
    applyDynamicAnnotations();
    alert("Test");
};