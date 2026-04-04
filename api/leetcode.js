// api/leetcode.js — Vercel serverless function
// Proxies LeetCode GraphQL to avoid CORS from the browser

export default async function handler(req, res) {
  const { username } = req.query
  if (!username) {
    return res.status(400).json({ error: 'username is required' })
  }

  const query = `
    query userStats($username: String!) {
      matchedUser(username: $username) {
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        profile {
          ranking
        }
      }
      allQuestionsCount {
        difficulty
        count
      }
    }
  `

  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query, variables: { username } }),
    })

    const json = await response.json()
    const user = json?.data?.matchedUser
    const allQ  = json?.data?.allQuestionsCount

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const getCount = (arr, diff) =>
      arr?.find(x => x.difficulty === diff)?.count ?? 0

    const solved = user.submitStats.acSubmissionNum
    const totals = allQ

    const easySolved   = getCount(solved, 'Easy')
    const mediumSolved = getCount(solved, 'Medium')
    const hardSolved   = getCount(solved, 'Hard')
    const totalSolved  = getCount(solved, 'All')

    const easyTotal    = getCount(totals, 'Easy')
    const mediumTotal  = getCount(totals, 'Medium')
    const hardTotal    = getCount(totals, 'Hard')

    // Acceptance rate not directly in this query; omit or fetch separately
    const acceptanceRate = null

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate')
    return res.status(200).json({
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      easyTotal,
      mediumTotal,
      hardTotal,
      ranking: user.profile?.ranking ?? null,
      acceptanceRate,
    })
  } catch (err) {
    return res.status(500).json({ error: 'LeetCode API error', details: err.message })
  }
}
