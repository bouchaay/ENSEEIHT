/**
 */
package shematables.tests;

import junit.framework.TestCase;

import junit.textui.TestRunner;

import shematables.Column;
import shematables.ShematablesFactory;

/**
 * <!-- begin-user-doc -->
 * A test case for the model object '<em><b>Column</b></em>'.
 * <!-- end-user-doc -->
 * @generated
 */
public class ColumnTest extends TestCase {

	/**
	 * The fixture for this Column test case.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	protected Column fixture = null;

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	public static void main(String[] args) {
		TestRunner.run(ColumnTest.class);
	}

	/**
	 * Constructs a new Column test case with the given name.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	public ColumnTest(String name) {
		super(name);
	}

	/**
	 * Sets the fixture for this Column test case.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	protected void setFixture(Column fixture) {
		this.fixture = fixture;
	}

	/**
	 * Returns the fixture for this Column test case.
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @generated
	 */
	protected Column getFixture() {
		return fixture;
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see junit.framework.TestCase#setUp()
	 * @generated
	 */
	@Override
	protected void setUp() throws Exception {
		setFixture(ShematablesFactory.eINSTANCE.createColumn());
	}

	/**
	 * <!-- begin-user-doc -->
	 * <!-- end-user-doc -->
	 * @see junit.framework.TestCase#tearDown()
	 * @generated
	 */
	@Override
	protected void tearDown() throws Exception {
		setFixture(null);
	}

} //ColumnTest
