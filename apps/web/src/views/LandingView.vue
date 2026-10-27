<template>
  <main class="marketing">
    <nav class="marketing-nav">
      <strong>
        <span class="marketing-mark">M</span>
        MemoFlo
      </strong>

      <div>
        <RouterLink to="/login" class="marketing-link">
          Login
        </RouterLink>
        <RouterLink to="/login" class="marketing-button marketing-button-link">
          Request a demo
        </RouterLink>
      </div>
    </nav>

    <section class="marketing-hero">
      <div>
        <span class="page-kicker">BUSINESS WORKFLOW PLATFORM</span>
        <h1>Run your company from one intelligent workspace.</h1>
        <p>
          MemoFlo brings approvals, requests, people, workflows and
          business operations into one beautifully structured platform.
        </p>

        <div class="marketing-actions">
          <RouterLink to="/login" class="marketing-button marketing-button-link">
            Get started
          </RouterLink>
          <RouterLink to="/login" class="marketing-link">
            Sign in to a company workspace →
          </RouterLink>
        </div>
      </div>

      <div class="marketing-panel">
        <div class="mini-window">
          <span>MEMOFLO WORKSPACE</span>
          <strong>Everything your business needs.</strong>

          <div class="mini-grid">
            <i
              v-for="module in ['M', 'L', 'P', 'A', 'E', 'D']"
              :key="module"
            >
              {{ module }}
            </i>
          </div>
        </div>
      </div>
    </section>

    <section class="marketing-features">
      <article>
        <b>01</b>
        <h3>Modular</h3>
        <p>Companies activate only the business modules they need.</p>
      </article>

      <article>
        <b>02</b>
        <h3>Workflow-native</h3>
        <p>Approvals and routing are built into the platform.</p>
      </article>

      <article>
        <b>03</b>
        <h3>Controlled</h3>
        <p>Roles and permissions keep every action accountable.</p>
      </article>
    </section>
  </main>
</template>
