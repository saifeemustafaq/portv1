import fetch from 'node-fetch';

async function getAuthToken() {
  const response = await fetch('http://localhost:3000/api/auth/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin',
      callbackUrl: 'http://localhost:3000/admin'
    })
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const cookies = response.headers.get('set-cookie');
  return cookies;
}

async function testProjectAPI() {
  try {
    console.log('Authenticating...');
    const authCookies = await getAuthToken();
    console.log('Authentication cookies:', authCookies);

    // Test data for a new project
    const projectData = {
      title: "Test Project",
      description: "Test Description",
      category: "software",
      tags: ["test"],
      skills: ["test"],
      image: null // Let's see if the backend generates a placeholder
    };

    console.log('\nSending test project data:', JSON.stringify(projectData, null, 2));

    // Make the API call with auth cookies
    const response = await fetch('http://localhost:3000/api/admin/project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookies
      },
      body: JSON.stringify(projectData),
    });

    // Log the raw response first
    const responseText = await response.text();
    console.log('\nRaw API Response:', responseText);

    try {
      // Try to parse as JSON if possible
      const data = JSON.parse(responseText);
      console.log('\nParsed API Response:', JSON.stringify(data, null, 2));

      // If project was created, fetch it to verify
      if (response.ok && data.project?._id) {
        console.log('\nFetching created project...');
        const getResponse = await fetch(
          `http://localhost:3000/api/admin/project/${data.project._id}`,
          {
            headers: {
              'Cookie': authCookies
            }
          }
        );
        const getProject = await getResponse.json();
        console.log('Retrieved project:', JSON.stringify(getProject, null, 2));
      }
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testProjectAPI(); 