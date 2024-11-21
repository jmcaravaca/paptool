document.addEventListener('DOMContentLoaded', () => {
    const gitlabApiUrl = 'https://gitlab.comunidad.madrid/api/v4';
    const privateToken = 'glpat-VRYpxh4XSgi3iW1y5NMK';

    const deploymentUsernameSelect = document.getElementById('deploymentUsernameSelect');
    const repoSelectContainer = document.getElementById('repoSelectContainer');
    const repoSelect = document.getElementById('repoSelect');
    const commitSelectContainer = document.getElementById('commitSelectContainer');
    const commitSelect = document.getElementById('commitSelect');
    const resultOrange = document.getElementById('resultOrange');
    const resultBlue = document.getElementById('resultBlue');

    const logButton = document.getElementById('logButton');
    const deployButton = document.getElementById('deployButton');

    const groupSelect = document.getElementById('groupSelect');
    const groupSpinner = document.getElementById('groupSpinner');
    const commitSpinner = document.getElementById('commitSpinner');
    const repoSpinner = document.getElementById('repoSpinner');

    let projectName, projectVersion, studioVersion, commitHash, commitUser, repoName, deploymentUsername;
    let deploymentDate, finishDate;

    // Helper function to format date for API
    function formatDate(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
    
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }    

    function clearVariablesAndDisableButton() {
        projectName = null;
        projectVersion = null;
        studioVersion = null;
        commitHash = null;
        commitUser = null;
        repoName = null;
        deploymentUsername = null;
        deploymentDate = null;
        finishDate = null;
    
        logButton.disabled = true;
        deployButton.disabled = true;
    }
        

    deploymentUsernameSelect.addEventListener('change', () => {
        groupSelectContainer.style.display = 'block';
        groupSelect.innerHTML = '<option selected disabled>Select group</option>';
        groupSpinner.style.display = 'block';
    
        fetchGroups();
    });
    
    function fetchGroups() {
        fetch(`${gitlabApiUrl}/groups`, {
            headers: { 'Authorization': `Bearer ${privateToken}` }
        })
        .then(response => response.json())
        .then(groups => {
            groupSelect.innerHTML = '<option selected disabled>Select group</option>';
    
            groups.forEach(group => {
                if (group.name.indexOf(' ') === -1 && (!group.name.startsWith('GRP-') || group.name === 'GRP-ARPA')) {
                    const option = document.createElement('option');
                    if (group.name === 'GRP-ARPA') {
                        option.value = group.id;
                        option.textContent = 'EVERYTHING';
                    } else {
                        option.value = group.id;
                        option.textContent = group.name;
                    }
                    groupSelect.appendChild(option);
                }
            });
            groupSpinner.style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching groups:', error);
            groupSpinner.style.display = 'none';
        });
    }
    
    
     

    // Show repositories dropdown on group selectselect
    groupSelect.addEventListener('change', () => {
        repoSelectContainer.style.display = 'block';
        repoSelect.innerHTML = '<option selected disabled>Select repository</option>';
        repoSpinner.style.display = 'block';
    
        const groupId = groupSelect.value;
    
        fetch(`${gitlabApiUrl}/groups/${groupId}/projects?per_page=100`, {
            headers: { 'Authorization': `Bearer ${privateToken}` }
        })
        .then(response => response.json())
        .then(repos => {
            repos.forEach(repo => {
                const option = document.createElement('option');
                option.value = repo.id;
                option.textContent = repo.name.toUpperCase();
                repoSelect.appendChild(option);
            });
            repoSpinner.style.display = 'none';
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
            repoSpinner.style.display = 'none';
        });
    });
    

    // Clear information and show commits when repo changes
    repoSelect.addEventListener('change', () => {
        resultOrange.innerHTML = '';
        resultBlue.innerHTML = '';
        commitSelectContainer.style.display = 'none';
        commitSelect.innerHTML = '<option selected disabled>Select commit</option>';
        commitSpinner.style.display = 'block';
    
        clearVariablesAndDisableButton();
    
        repoName = repoSelect.options[repoSelect.selectedIndex].text;
    
        const repoId = repoSelect.value;
        if (repoId) {
            fetch(`${gitlabApiUrl}/projects/${repoId}/repository/commits`, {
                headers: { 'Authorization': `Bearer ${privateToken}` }
            })
            .then(response => response.json())
            .then(commits => {
                commits.slice(0, 5).forEach(commit => {
                    const option = document.createElement('option');
                    option.value = commit.id;
                    option.textContent = `${commit.short_id} - ${commit.title}`;
                    commitSelect.appendChild(option);
                });
                commitSelectContainer.style.display = 'block';
                commitSpinner.style.display = 'none';
            })
            .catch(error => {
                console.error('Error fetching commits:', error);
                commitSpinner.style.display = 'none';
            });
        }
    });
    

    // Fetch project.json on commit select
    commitSelect.addEventListener('change', () => {
        const repoId = repoSelect.value;
        const commitId = commitSelect.value;
        deploymentUsername = deploymentUsernameSelect.value;
    
        if (repoId && commitId && deploymentUsername) {
            fetch(`${gitlabApiUrl}/projects/${repoId}/repository/commits/${commitId}`, {
                headers: { 'Authorization': `Bearer ${privateToken}` }
            })
            .then(response => response.json())
            .then(commit => {
                commitHash = commit.id;
                commitUser = commit.author_name;
                const commitTitle = commit.title;
    
                fetch(`${gitlabApiUrl}/projects/${repoId}/repository/files/project.json/raw?ref=${commitId}`, {
                    headers: { 'Authorization': `Bearer ${privateToken}` }
                })
                .then(response => response.json())
                .then(content => {
                    projectName = content.name;
                    projectVersion = content.projectVersion;
                    studioVersion = content.studioVersion;
    
                    deploymentDate = new Date();
                    finishDate = new Date(deploymentDate.getTime() + 5 * 60000);
    
                    resultOrange.innerHTML = `
                        <h5>Deployment Username: <span class="text-dark">${deploymentUsername}</span></h5>
                        <h5>Commit Hash: <span class="text-dark">${commitHash}</span></h5>
                        <h5>Repository Name: <span class="text-dark">${repoName}</span></h5>
                        <h5>Project Version: <span class="text-dark">${projectVersion}</span></h5>
                        <h5>Studio Version: <span class="text-dark">${studioVersion}</span></h5>
                        <h5>Deployment Date: <span class="text-dark">${formatDate(deploymentDate)}</span></h5>
                        <h5>Finish Date: <span class="text-dark">${formatDate(finishDate)}</span></h5>
                    `;
    
                    resultBlue.innerHTML = `
                        <h5>Commit User: <span class="text-dark">${commitUser}</span></h5>
                        <h5>Commit Title: <span class="text-dark">${commitTitle}</span></h5>
                        <h5>Package Name: <span class="text-dark">${projectName}</span></h5>
                    `;
    
                    logButton.disabled = false;
                    deployButton.disabled = false;
                })
                .catch(error => {
                    console.error('Error fetching project.json:', error);
                });
            })
            .catch(error => {
                console.error('Error fetching commit details:', error);
            });
        }
    });
    

    function logValues() {
        console.log('Deployment Username:', deploymentUsername);
        console.log('Commit Hash:', commitHash);
        console.log('Repository Name:', repoName);
        console.log('Project Version:', projectVersion);
        console.log('Studio Version:', studioVersion);
        const deploymentDateFormatted = formatDate(deploymentDate);
        console.log('Deployment Date:', deploymentDateFormatted);
        const finishDateFormatted = formatDate(finishDate);
        console.log('Finish Date:', finishDateFormatted);

        const payload = {
            idApp: 4,
            idConsulta: "cmta_insert_hist_despliegue",
            parametros: [
                { tipo: "string", valor: repoName },
                { tipo: "string", valor: "PRODUCCION" },
                { tipo: "string", valor: projectVersion },
                { tipo: "string", valor: studioVersion },
                { tipo: "string", valor: commitHash },
                { tipo: "string", valor: deploymentUsername },
                { tipo: "string", valor: deploymentUsername },
                { tipo: "string", valor: deploymentDateFormatted },
                { tipo: "string", valor: finishDateFormatted }
            ]
        };       
        console.log(JSON.stringify(payload)) 
    } // Log values on button click
    logButton.addEventListener('click', logValues);
    
    // Function to deploy
    function Deploy() {
        const deploymentDateFormatted = formatDate(deploymentDate);
        const finishDateFormatted = formatDate(finishDate);

        const payload = {
            idApp: 4,
            idConsulta: "cmta_insert_hist_despliegue",
            parametros: [
                { tipo: "string", valor: repoName },
                { tipo: "string", valor: "PRODUCCION" },
                { tipo: "string", valor: projectVersion },
                { tipo: "string", valor: studioVersion },
                { tipo: "string", valor: commitHash },
                { tipo: "string", valor: deploymentUsername },
                { tipo: "string", valor: deploymentUsername },
                { tipo: "string", valor: deploymentDateFormatted },
                { tipo: "string", valor: finishDateFormatted }
            ]
        };

        fetch('https://intranet3.madrid.org/mova_rest_servicios/v1/consultas/actualizar', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic UFBST19BUFA6UFBST19BUFA=',
                'Content-Type': 'application/json',
                'Cookie': 'srv_id=a8a16aa00404192151cf94016aa1df42'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Deployment successful:', data);
        })
        .catch(error => {
            console.error('Error deploying:', error);
        });
    }
    // Deploy on button click
    deployButton.addEventListener('click', Deploy);    
});
