<template>
  <div id="app">
    <div v-if="isLoading" class="loading">
      Carregando...
    </div>
    <h1>Sorteio de Equipes</h1>
    <div class="disclaimer">
      <button @click="toggleHelp" ref="helpButton">Ajuda</button>
      <div v-if="showHelp" class="help-content" @click.self="toggleHelp">
        <p>Insira a lista de jogadores. Um jogador em cada Linha:</p>
        <ul>
          <li>Texto copiado do WhatsApp com o nome dos jogadores iniciados por número:</li>
          <div>
            horario: 18:00<br />
            local: ginasio<br />
            <br />
            1 - jogador<br />
            2 - outro Jogador<br />
          </div>
          <li>Número. Nome (ex.: 1. Jogador1)</li>
          <li>Número - Nome (ex.: 1 - Jogador1)</li>
          <li>Número Nome (ex.: 1 Jogador1)</li>
          <li>Nome (ex.: Jogador1)</li>
        </ul>
      </div>
    </div>
    <textarea v-model="inputText" placeholder="Insira a lista de jogadores"></textarea>
    <select v-model="numTeams">
      <option v-for="n in 9" :key="n" :value="n + 1">{{ n + 1 }} Equipes</option>
    </select>
    <div class="buttons">
      <button @click="sortear" style="flex: 9;">Sortear Equipes</button>
      <button class="clear-button" style="flex: 1;" @click="confirmClear">Limpar Lista</button>
    </div>
    <div v-if="teams.length" class="teams-container">
      <div v-for="(team, index) in teams" :key="index" class="team">
        <h2>Equipe {{ index + 1 }}</h2>
        <ul>
          <li 
            :class="{ 'gender-m': player.gender === 'M', 'gender-f': player.gender === 'F' }"
            v-for="(player, playerIndex) in team" :key="player">
            {{ playerIndex + 1 }} - {{ player }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      inputText: localStorage.getItem('inputText') || '',
      numTeams: 2,
      teams: [],
      lastTwoSorts: [],
      showHelp: false,
      nomes: [],
      nomeMap: new Map(),
      isLoading: true
    }
  },
  watch: {
    inputText(newValue) {
      localStorage.setItem('inputText', newValue);
    }
  },
  mounted() {
    document.addEventListener('click', this.closeHelp);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.closeHelp);
  },
  async created() {
    try {
      const response = await fetch('grupos.json');
      if (!response.ok) {
        throw new Error(`Erro ao carregar o JSON: ${response.statusText}`);
      }
      this.nomes = await response.json();

      this.nomes.forEach(item => {
        this.nomeMap.set(item.name.toLowerCase(), item.classification);

        if (item.names) {
          const alternativos = item.names.split('|').filter(Boolean);
          alternativos.forEach(alt => {
            this.nomeMap.set(alt.toLowerCase(), item.classification);
          });
        }
      });

      console.log('Mapa de nomes criado:', this.nomeMap);
    } catch (error) {
      console.error('Erro ao carregar os nomes:', error);
    } finally {
      this.isLoading = false;
    }
  },
  methods: {
    normalizarTexto(texto) {
      return texto
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    },
    identificarGenero(nome) {
      const nomeFormatado = this.normalizarTexto(nome);
      return this.nomeMap.get(nomeFormatado) || 'D';
    },
    sortear() {
      const players = this.extractPlayers(this.inputText);
      let newTeams = this.shufflePlayersIntoTeams(players, this.numTeams);
      this.teams = newTeams;
    },
    extractPlayers(text) {
      const lines = text.split('\n');
      let players = [];
      const regex = /^\d+\s*[-.\s]\s*(.+)$/;
      const sequentialLines = lines.filter(line => regex.test(line));

      if (sequentialLines.length > 0) {
        players = sequentialLines.map(line => line.match(regex)[1].trim());
      } else {
        players = lines.filter(line => line.trim() !== '').map(line => line.trim());
      }

      return players;
    },
    shufflePlayersIntoTeams(players, numTeams) {
      for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
      }

      const teams = Array.from({ length: numTeams }, () => []);

      const playersM = players.filter(player => this.identificarGenero(player.split(' ')[0]) === "M").map(player => ({ name: player, gender: "M" }));
      console.log('playersM', playersM);

      playersM.forEach((player, index) => {
        teams[index % numTeams].push(player);
      });

      teams.sort((a, b) => a.length - b.length);
      console.log('teams', teams);

      const playersF = players.filter(player => this.identificarGenero(player.split(' ')[0]) === "F").map(player => ({ name: player, gender: "F" }));
      console.log('playersF', playersF);

      playersF.forEach((player, index) => {
        teams[index % numTeams].push(player);
      });

      teams.sort((a, b) => a.length - b.length);
      console.log('teams', teams);

      const playersD = players.filter(player => this.identificarGenero(player.split(' ')[0]) === "D").map(player => ({ name: player, gender: "D" }));
      console.log('playersD', playersD);

      playersD.forEach((player, index) => {
        teams[index % numTeams].push(player);
      });

      teams.sort((a, b) => a.length - b.length);
      console.log('teams', teams);

      teams.forEach(team => {
        for (let i = team.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [team[i], team[j]] = [team[j], team[i]];
        }
      });

      return teams;
    },
    toggleHelp() {
      this.showHelp = !this.showHelp;
    },
    closeHelp(event) {
      if (!this.$refs.helpButton.contains(event.target)) {
        this.showHelp = false;
      }
    },
    confirmClear() {
      if (confirm('Você realmente quer limpar a lista atual?')) {
        this.inputText = '';
        localStorage.removeItem('inputText');
      }
    },
  }
}
</script>

<style scoped>
#app {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  font-family: 'Arial, sans-serif';
}

h1 {
  text-align: center;
  color: #333;
}

.gender-f {
  background-color: #a507b613;
}

.gender-m {
  background-color: #0079fa17;
}

.disclaimer {
  position: relative;
  margin-bottom: 25px;
}

button {
  display: inline-block;
  padding: 10px 20px;
  background-color: #007BFF;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.clear-button {
  margin-left: 10px;
  background-color: #dc3545;
}

.clear-button:hover {
  background-color: #c82333;
}

.help-content {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.help-content pre {
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  white-space: pre-wrap;
  /* Ensures the text wraps properly */
  margin: 10px 0;
  font-family: 'Courier New', Courier, monospace;
}

textarea {
  width: 100%;
  height: 150px;
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

select {
  display: block;
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 16px;
  background-color: #fff;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.buttons {
  display: flex;
  justify-content: space-between;
}

button {
  display: block;
  width: calc(50% - 5px);
  padding: 10px;
  background-color: #007BFF;
  color: #fff;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.teams-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.team {
  flex: 1 1 calc(50% - 20px);
  background-color: #fff;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #007BFF;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  background-color: #f1f1f1;
  padding: 5px;
  border-radius: 3px;
  margin-bottom: 5px;
}
</style>
