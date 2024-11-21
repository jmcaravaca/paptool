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

    let projectName, projectVersion, studioVersion, commitHash, commitUser, repoName, deploymentUsername;
    let deploymentDate, finishDate;

    // Show repositories dropdown on deployment username select
    deploymentUsernameSelect.addEventListener('change', () => {
        repoSelectContainer.style.display = 'block';
        repoSelect.innerHTML = '<option selected disabled>Select repository</option>';

        // Fetch repositories
        fetch(`${gitlabApiUrl}/projects?membership=true&order_by=last_activity_at`, {
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
        })
        .catch(error => {
            console.error('Error fetching repositories:', error);
        });
    });

    // Clear information and show commits when repo changes
    repoSelect.addEventListener('change', () => {
        // Clear displayed information
        resultOrange.innerHTML = '';
        resultBlue.innerHTML = '';
        commitSelectContainer.style.display = 'none';
        commitSelect.innerHTML = '<option selected disabled>Select commit</option>';

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
                    option.textContent = `${commit.short_id} - ${commit.author_name}`;
                    commitSelect.appendChild(option);
                });
                commitSelectContainer.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching commits:', error);
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
                        <h5>Deployment Date: <span class="text-dark">${deploymentDate.toLocaleString()}</span></h5>
                        <h5>Finish Date: <span class="text-dark">${finishDate.toLocaleString()}</span></h5>
                    `;

                    resultBlue.innerHTML = `
                        <h5>Commit User: <span class="text-dark">${commitUser}</span></h5>
                        <h5>Package Name: <span class="text-dark">${projectName}</span></h5>
                    `;
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

    // Log values on button click
    logButton.addEventListener('click', () => {
        console.log('Deployment Username:', deploymentUsername);
        console.log('Commit Hash:', commitHash);
        console.log('Repository Name:', repoName);
        console.log('Project Version:', projectVersion);
        console.log('Studio Version:', studioVersion);
        console.log('Deployment Date:', deploymentDate.toLocaleString());
        console.log('Finish Date:', finishDate.toLocaleString());
    });
});
