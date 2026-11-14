import { useState, useEffect } from 'react'
import personService from './services/persons'
import './index.css'

const Notification = ({ notification }) => {
  if (notification === null) {
    return null
  }

  return (
    <div className={`notification ${notification.type}`}>
      {notification.message}
    </div>
  )
}

const Filter = ({ filterTerm, handleFilterChange }) => (
  <div>
    filter shown with <input value={filterTerm} onChange={handleFilterChange} />
  </div>
)

const PersonForm = ({
  onSubmit,
  newName,
  handleNameChange,
  newNumber,
  handleNumberChange
}) => (
  <form onSubmit={onSubmit}>
    <div>
      name: <input value={newName} onChange={handleNameChange} />
    </div>
    <div>
      number: <input value={newNumber} onChange={handleNumberChange} />
    </div>
    <div>
      <button type="submit">add</button>
    </div>
  </form>
)

const Person = ({ person, deletePerson }) => (
  <p>
    {person.name} {person.number}{' '}
    <button onClick={() => deletePerson(person.id, person.name)}>
      delete
    </button>
  </p>
)

const Persons = ({ personsToShow, deletePerson }) => (
  <div>
    {personsToShow.map(person => (
      <Person
        key={person.id}
        person={person}
        deletePerson={deletePerson}
      />
    ))}
  </div>
)

const App = () => {
  const [persons, setPersons] = useState([])
  const [newName, setNewName] = useState('')
  const [newNumber, setNewNumber] = useState('')
  const [filterTerm, setFilterTerm] = useState('')
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    personService
      .getAll()
      .then(initialPersons => {
        setPersons(initialPersons)
      })
  }, [])

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  const handleNameChange = (event) => {
    setNewName(event.target.value)
  }

  const handleNumberChange = (event) => {
    setNewNumber(event.target.value)
  }

  const handleFilterChange = (event) => {
    setFilterTerm(event.target.value)
  }

  const addPerson = (event) => {
    event.preventDefault()

    const existingPerson = persons.find(
      person => person.name.toLowerCase() === newName.trim().toLowerCase()
    )

    if (existingPerson) {
      const confirmUpdate = window.confirm(
        `${existingPerson.name} is already added to phonebook, replace the old number with a new one?`
      )

      if (confirmUpdate) {
        const changedPerson = { ...existingPerson, number: newNumber.trim() }

        personService
          .update(existingPerson.id, changedPerson)
          .then(returnedPerson => {
            setPersons(persons.map(person =>
              person.id !== existingPerson.id ? person : returnedPerson
            ))
            setNewName('')
            setNewNumber('')
            showNotification(`Updated ${returnedPerson.name}'s number`, 'success')
          })
          .catch(() => {
            showNotification(
              `Information of ${existingPerson.name} has already been removed from server`,
              'error'
            )
            setPersons(persons.filter(person => person.id !== existingPerson.id))
          })
      }
      return
    }

    const personObject = {
      name: newName.trim(),
      number: newNumber.trim()
    }

    personService
      .create(personObject)
      .then(returnedPerson => {
        setPersons(persons.concat(returnedPerson))
        setNewName('')
        setNewNumber('')
        showNotification(`Added ${returnedPerson.name}`, 'success')
      })
  }

  const deletePerson = (id, name) => {
    if (window.confirm(`Delete ${name} ?`)) {
      personService
        .remove(id)
        .then(() => {
          setPersons(persons.filter(person => person.id !== id))
          showNotification(`Deleted ${name}`, 'success')
        })
        .catch(() => {
          showNotification(
            `Information of ${name} has already been removed from server`,
            'error'
          )
          setPersons(persons.filter(person => person.id !== id))
        })
    }
  }

  const personsToShow = filterTerm === ''
    ? persons
    : persons.filter(person =>
        person.name.toLowerCase().includes(filterTerm.toLowerCase())
      )

  return (
    <div>
      <h2>Phonebook</h2>

      <Notification notification={notification} />

      <Filter
        filterTerm={filterTerm}
        handleFilterChange={handleFilterChange}
      />

      <h3>Add a new</h3>

      <PersonForm
        onSubmit={addPerson}
        newName={newName}
        handleNameChange={handleNameChange}
        newNumber={newNumber}
        handleNumberChange={handleNumberChange}
      />

      <h3>Numbers</h3>

      <Persons
        personsToShow={personsToShow}
        deletePerson={deletePerson}
      />
    </div>
  )
}

export default App